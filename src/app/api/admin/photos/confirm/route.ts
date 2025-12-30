import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/server/auth/require-admin";
import { prisma } from "@/server/db/prisma";
import { headObject, photoCdnUrl } from "@/server/aws/s3";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/server/photos/constants";

export const runtime = "nodejs";

const BodySchema = z.object({
  photoId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { photoId } = parsed.data;

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo || photo.deletedAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (photo.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_CONFIRMED" }, { status: 409 });
  }

  const head = await headObject(photo.key).catch(() => null);
  if (!head) {
    return NextResponse.json({ error: "S3_OBJECT_NOT_FOUND" }, { status: 409 });
  }

  const actualType = head.ContentType ?? "";
  const actualSize = Number(head.ContentLength ?? 0);

  // Strict checks (MVP safe)
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(actualType)) {
    return NextResponse.json({ error: "INVALID_CONTENT_TYPE", actualType }, { status: 400 });
  }

  if (actualSize <= 0 || actualSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "INVALID_SIZE", actualSize }, { status: 400 });
  }

  // Optional: ensure matches what we expected
  if (actualType !== photo.contentType) {
    return NextResponse.json(
      { error: "CONTENT_TYPE_MISMATCH", expected: photo.contentType, actual: actualType },
      { status: 400 }
    );
  }

  // Size mismatch can happen rarely; you can decide to update instead of failing.
  if (actualSize !== photo.size) {
    return NextResponse.json(
      { error: "SIZE_MISMATCH", expected: photo.size, actual: actualSize },
      { status: 400 }
    );
  }

  const updated = await prisma.photo.update({
    where: { id: photo.id },
    data: { status: "READY" },
    select: { id: true, status: true, key: true },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    url: photoCdnUrl(updated.key),
  });
}
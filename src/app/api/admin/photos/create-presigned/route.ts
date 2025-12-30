import { NextRequest, NextResponse } from "next/server";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from "@/server/photos/constants";
import { makePhotoKey, sanitizeOriginalName } from "@/server/photos/keys";
import { createPresignedPutUrl, photoCdnUrl } from "@/server/aws/s3";
import { requireAdmin } from "@/server/auth/require-admin";
import { prisma } from "@/server/db/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
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

  const { fileName, contentType, size } = parsed.data;

  const key = makePhotoKey(contentType);
  const originalName = sanitizeOriginalName(fileName);

  const photo = await prisma.photo.create({
    data: {
      key,
      contentType,
      size,
      originalName,
      status: "PENDING",
      createdById: admin.userId || null,
    },
    select: { id: true, key: true, contentType: true },
  });

  const presign = await createPresignedPutUrl({
    key: photo.key,
    contentType: photo.contentType,
  });

  return NextResponse.json({
    photoId: photo.id,
    key: photo.key,
    cdnUrl: photoCdnUrl(photo.key),
    uploadUrl: presign.url,
    uploadHeaders: presign.headers,
    expiresIn: presign.expiresIn,
  });
}
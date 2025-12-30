import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { deleteObject } from "@/server/aws/s3";
import { requireAdmin } from "@/server/auth/require-admin";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // await-safe for Next 15/16
) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo || photo.deletedAt) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // soft delete in DB
  await prisma.photo.update({
    where: { id },
    data: { status: "DELETED", deletedAt: new Date() },
  });

  // best-effort delete in S3
  await deleteObject(photo.key).catch(() => null);

  return NextResponse.json({ ok: true as const });
}
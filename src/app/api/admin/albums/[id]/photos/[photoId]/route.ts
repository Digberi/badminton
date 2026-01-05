import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; photoId: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id: albumId, photoId } = await ctx.params;

  await prisma.albumPhoto.delete({
    where: { albumId_photoId: { albumId, photoId } },
  }).catch(() => null);

  return NextResponse.json({ ok: true as const });
}
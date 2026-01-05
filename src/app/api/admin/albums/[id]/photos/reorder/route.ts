import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  orderedPhotoIds: z.array(z.string().min(1)).min(1).max(2000),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id: albumId } = await ctx.params;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }

  const ids = parsed.data.orderedPhotoIds;

  await prisma.$transaction(
    ids.map((photoId, index) =>
      prisma.albumPhoto.update({
        where: { albumId_photoId: { albumId, photoId } },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ ok: true as const });
}
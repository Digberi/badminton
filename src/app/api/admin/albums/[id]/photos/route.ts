import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { photoCdnUrl } from "@/server/aws/s3";

export const runtime = "nodejs";

const AddSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1).max(200),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id: albumId } = await ctx.params;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const items = await prisma.albumPhoto.findMany({
    where: {
      albumId,
      photo: { deletedAt: null, status: "READY" },
    },
    orderBy: [{ position: "asc" }],
    select: {
      photoId: true,
      position: true,
      photo: { select: { key: true, originalName: true, createdAt: true } },
    },
  });

  return NextResponse.json({
    album: {
      id: album.id,
      slug: album.slug,
      title: album.title,
      description: album.description,
      visibility: album.visibility,
      order: album.order,
      coverPhotoId: album.coverPhotoId,
    },
    items: items.map((it) => ({
      photoId: it.photoId,
      position: it.position,
      url: photoCdnUrl(it.photo.key),
      originalName: it.photo.originalName,
      createdAt: it.photo.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id: albumId } = await ctx.params;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }

  const photoRows = await prisma.photo.findMany({
    where: { id: { in: parsed.data.photoIds }, deletedAt: null },
    select: { id: true },
  });

  const ids = photoRows.map((p) => p.id);
  if (!ids.length) return NextResponse.json({ ok: true as const, added: 0 });

  const max = await prisma.albumPhoto.aggregate({
    where: { albumId },
    _max: { position: true },
  });

  const start = (max._max.position ?? -1) + 1;

  await prisma.albumPhoto.createMany({
    data: ids.map((photoId, idx) => ({
      albumId,
      photoId,
      position: start + idx,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true as const, added: ids.length });
}
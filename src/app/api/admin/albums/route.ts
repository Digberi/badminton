import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { ensureUniqueAlbumSlug, normalizeSlug } from "@/server/albums/slug";
import { photoCdnUrl } from "@/server/aws/s3";

export const runtime = "nodejs";

const CreateSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
  order: z.number().int().min(0).max(9999).optional(),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const albums = await prisma.album.findMany({
    where: { deletedAt: null },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      coverPhoto: { select: { key: true, status: true, deletedAt: true } },
      photos: {
        take: 1,
        orderBy: { position: "asc" },
        include: { photo: { select: { key: true, status: true, deletedAt: true } } },
      },
      _count: { select: { photos: true } },
    },
  });

  return NextResponse.json({
    items: albums.map((a) => {
      const coverKey =
        (a.coverPhoto && a.coverPhoto.status === "READY" && !a.coverPhoto.deletedAt
          ? a.coverPhoto.key
          : null) ??
        (a.photos[0]?.photo &&
        a.photos[0].photo.status === "READY" &&
        !a.photos[0].photo.deletedAt
          ? a.photos[0].photo.key
          : null);

      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        description: a.description,
        visibility: a.visibility,
        order: a.order,
        coverUrl: coverKey ? photoCdnUrl(coverKey) : null,
        count: a._count.photos,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, visibility, order } = parsed.data;
  const rawSlug = parsed.data.slug ? normalizeSlug(parsed.data.slug) : "";
  const slug = await ensureUniqueAlbumSlug(rawSlug || title);

  const album = await prisma.album.create({
    data: {
      title,
      slug,
      description: description?.trim() || null,
      visibility,
      order: order ?? 0,
      createdById: admin.userId || null,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ ok: true as const, id: album.id, slug: album.slug });
}
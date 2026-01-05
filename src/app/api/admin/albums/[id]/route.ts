import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { ensureUniqueAlbumSlug, normalizeSlug } from "@/server/albums/slug";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  slug: z.string().optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let slug: string | undefined;
  if (parsed.data.slug !== undefined) {
    const raw = normalizeSlug(parsed.data.slug);
    slug = await ensureUniqueAlbumSlug(raw || existing.title, { excludeId: id });
  }

  await prisma.album.update({
    where: { id },
    data: {
      title: parsed.data.title ?? undefined,
      description: parsed.data.description !== undefined ? (parsed.data.description.trim() || null) : undefined,
      visibility: parsed.data.visibility ?? undefined,
      order: parsed.data.order ?? undefined,
      slug,
    },
  });

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id } = await ctx.params;

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.album.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true as const });
}
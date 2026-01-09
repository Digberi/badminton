import {NextRequest, NextResponse} from "next/server";

import type { RouteInfoToDeleteRoute, RouteInfoToPutRoute } from "@/lib/routes/next-route-types";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { ensureUniqueAlbumSlug, normalizeSlug } from "@/server/albums/slug";
import { DELETE as DELETEInfo, PUT as PUTInfo, Route } from "./route.info";

export const runtime = "nodejs";

const UpdateSchema = PUTInfo.body;

export const PUT: RouteInfoToPutRoute<typeof PUTInfo, typeof Route> = async (req, ctx) => {
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
      description: parsed.data.description != undefined ? (parsed.data.description.trim() || null) : undefined,
      visibility: parsed.data.visibility ?? undefined,
      order: parsed.data.order ?? undefined,
      slug,
      coverPhotoId: parsed.data.coverPhotoId ?? undefined,
    },
  });

  return NextResponse.json({ ok: true as const });
}

export const DELETE : RouteInfoToDeleteRoute<typeof DELETEInfo, typeof Route> = async (req, ctx) => {
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
};

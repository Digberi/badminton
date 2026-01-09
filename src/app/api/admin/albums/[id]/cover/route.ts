import { NextResponse } from "next/server";

import type { RouteInfoToPutRoute } from "@/lib/routes/next-route-types";

import { prisma } from "@/server/db/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { PUT as PUTInfo, Route } from "./route.info";

export const runtime = "nodejs";

const BodySchema = PUTInfo.body;

export const PUT: RouteInfoToPutRoute<typeof PUTInfo, typeof Route> = async (req, ctx) => {
  const admin = await requireAdmin(req);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { id: albumId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", issues: parsed.error.flatten() }, { status: 400 });
  }

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.deletedAt) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (parsed.data.photoId) {
    // Ensure photo belongs to album
    const link = await prisma.albumPhoto.findUnique({
      where: { albumId_photoId: { albumId, photoId: parsed.data.photoId } },
      select: { photoId: true },
    });
    if (!link) return NextResponse.json({ error: "PHOTO_NOT_IN_ALBUM" }, { status: 400 });
  }

  await prisma.album.update({
    where: { id: albumId },
    data: { coverPhotoId: parsed.data.photoId },
  });

  return NextResponse.json({ ok: true as const });
};

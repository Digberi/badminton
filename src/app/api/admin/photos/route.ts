import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";
import { requireAdmin } from "@/server/auth/require-admin";

export const runtime = "nodejs";

const SearchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
  cursor: z.string().optional(),
  includePending: z.coerce.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const parsed = SearchSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit, cursor, includePending } = parsed.data;

  const take = limit + 1;

  const where = {
    deletedAt: null,
    ...(includePending ? {} : { status: "READY" as const }),
  };

  const rows = await prisma.photo.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      key: true,
      status: true,
      originalName: true,
      contentType: true,
      size: true,
      createdAt: true,
      albumPhotos: {
        where: { album: { deletedAt: null } },
        select: {
          album: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]!.id : null;

  return NextResponse.json({
    items: page.map((p) => ({
      id: p.id,
      status: p.status,
      url: photoCdnUrl(p.key),
      originalName: p.originalName,
      contentType: p.contentType,
      size: p.size,
      createdAt: p.createdAt.toISOString(),
      albums: p.albumPhotos.map((ap) => ap.album),
    })),
    nextCursor,
  });
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";

export const runtime = "nodejs";

const SearchSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
  cursor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const parsed = SearchSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit, cursor } = parsed.data;

  const take = limit + 1;

  const rows = await prisma.photo.findMany({
    where: {
      status: "READY",
      deletedAt: null,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, key: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]!.id : null;

  return NextResponse.json({
    items: page.map((p) => ({
      id: p.id,
      url: photoCdnUrl(p.key),
      createdAt: p.createdAt.toISOString(),
    })),
    nextCursor,
  });
}
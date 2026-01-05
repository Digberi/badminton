import "server-only";

import { prisma } from "@/server/db/prisma";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return s.slice(0, 80);
}

export function assertSlug(slug: string) {
  if (!slug || !SLUG_RE.test(slug)) {
    throw new Error("Invalid slug. Use kebab-case (a-z0-9-).");
  }
}

export async function ensureUniqueAlbumSlug(base: string, opts?: { excludeId?: string }) {
  let slug = normalizeSlug(base);
  if (!slug) slug = `album-${Date.now()}`;

  // Try base, base-2, base-3 ...
  for (let i = 0; i < 25; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;

    const existing = await prisma.album.findFirst({
      where: {
        slug: candidate,
        ...(opts?.excludeId ? { NOT: { id: opts.excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  // fallback
  return `${slug}-${Math.random().toString(16).slice(2, 8)}`;
}
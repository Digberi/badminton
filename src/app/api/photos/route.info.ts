import { z } from "zod";

export const Route = {
  name: "ApiPhotos",
  params: z.object({}),
  search: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
  }),
} as const;

export const GET = {
  result: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        createdAt: z.string(),
      })
    ),
    nextCursor: z.string().nullable(),
  }),
} as const;
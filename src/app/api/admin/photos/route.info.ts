import { z } from "zod";

export const Route = {
  name: "ApiAdminPhotos",
  params: z.object({}),
  search: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
    includePending: z.coerce.boolean().optional(),
  }),
} as const;

export const GET = {
  result: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "READY", "DELETED"]),
        url: z.string().url(),
        originalName: z.string().nullable(),
        contentType: z.string(),
        size: z.number().int(),
        createdAt: z.string(),
      })
    ),
    nextCursor: z.string().nullable(),
  }),
} as const;
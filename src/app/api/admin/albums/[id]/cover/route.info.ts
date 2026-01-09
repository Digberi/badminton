import { z } from "zod";

export const Route = {
  name: "ApiAdminAlbumsIdCover",
  params: z.object({
    id: z.string().min(1),
  }),
  search: z.object({}),
} as const;

export const PUT = {
  body: z.object({
    photoId: z.string().min(1).nullable(),
  }),
  result: z.object({
    ok: z.literal(true),
  }),
} as const;

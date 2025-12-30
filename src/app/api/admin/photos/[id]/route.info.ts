import { z } from "zod";

export const Route = {
  name: "ApiAdminPhotosId",
  params: z.object({
    id: z.string().min(1),
  }),
} as const;

export const DELETE = {
  result: z.object({
    ok: z.literal(true),
  }),
} as const;
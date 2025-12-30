import { z } from "zod";

export const Route = {
  name: "ApiAdminPhotosConfirm",
  params: z.object({}),
} as const;

export const POST = {
  body: z.object({
    photoId: z.string().min(1),
  }),
  result: z.object({
    id: z.string(),
    status: z.enum(["PENDING", "READY", "DELETED"]),
    url: z.string().url(),
  }),
} as const;
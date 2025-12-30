import { z } from "zod";
import { ALLOWED_MIME_TYPES } from "@/server/photos/constants";

export const Route = {
  name: "ApiAdminPhotosCreatePresigned",
  params: z.object({}),
} as const;

export const POST = {
  body: z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.enum(ALLOWED_MIME_TYPES),
    size: z.number().int().positive(),
  }),
  result: z.object({
    photoId: z.string(),
    key: z.string(),
    cdnUrl: z.string().url(),
    uploadUrl: z.string().url(),
    uploadHeaders: z.record(z.string(), z.string()),
    expiresIn: z.number().int(),
  }),
} as const;
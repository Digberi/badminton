import { z } from "zod";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/photos/constants";

export const Route = {
  name: "ApiAdminPhotosCreatePresigned",
  params: z.object({}),
  search: z.object({}),
} as const;

export const POST = {
  body: z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.enum(ALLOWED_MIME_TYPES),
    size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
    albumId: z.string().min(1).optional(),
  }),
  result: z.object({
    photoId: z.string().min(1),
    key: z.string().min(1),
    cdnUrl: z.string().url(),
    uploadUrl: z.string().url(),
    uploadHeaders: z.record(z.string(), z.string()),
    expiresIn: z.number().int(),
  }),
} as const;
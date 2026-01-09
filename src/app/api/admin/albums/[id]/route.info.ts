import { z } from "zod";
import {AlbumVisibility} from "@/generated/prisma/enums";

export const Route = {
  name: "ApiAdminAlbumsId",
  params: z.object({
    id: z.string().min(1),
  }),
  search: z.object({}),
} as const;

const AlbumVisibilitySchema = z.nativeEnum(AlbumVisibility);

export const PUT = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    visibility: AlbumVisibilitySchema.optional(),
    order: z.number().int().min(0).optional(),
    coverPhotoId: z.string().min(1).nullable().optional(),
  }),
  result: z.object({ ok: z.literal(true) }),
} as const;

export const DELETE = {
  result: z.object({ ok: z.literal(true) }),
} as const;

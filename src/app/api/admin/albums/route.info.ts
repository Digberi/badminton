import { z } from "zod";
import {AlbumVisibility} from "@/generated/prisma/enums";

export const Route = {
  name: "ApiAdminAlbums",
  params: z.object({}),
  search: z.object({}),
} as const;

const AlbumVisibilitySchema = z.nativeEnum(AlbumVisibility);

const AlbumListItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  visibility: AlbumVisibilitySchema,
  order: z.number().int(),
  coverUrl: z.string().url().nullable(),
  photosCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const GET = {
  result: z.object({
    items: z.array(AlbumListItemSchema),
  }),
} as const;

export const POST = {
  body: z.object({
    title: z.string().min(1).max(200),
    slug: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    visibility: AlbumVisibilitySchema.optional().default(AlbumVisibility.PUBLIC),
    order: z.number().int().min(0).optional(),
  }),
  result: z.object({
    ok: z.literal(true),
    id: z.string().min(1),
    slug: z.string().min(1),
  }),
} as const;

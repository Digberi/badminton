import { z } from "zod";
import { languages } from "@/i18n/settings";

export const Route = {
  name: "GalleryAlbum",
  params: z.object({
    lng: z.enum(languages),
    slug: z.string().min(1),
  }),
  meta: {
    hideInMenu: true
  },
} as const;
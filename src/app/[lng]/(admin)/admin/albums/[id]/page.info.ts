import { z } from "zod";
import { languages } from "@/i18n/settings";

export const Route = {
  name: "AdminAlbumDetail",
  params: z.object({
    lng: z.enum(languages),
    id: z.string().min(1),
  }),
  meta: {
    title: { ns: "common", key: "nav.albums" },
    hideInMenu: true
  },
} as const;
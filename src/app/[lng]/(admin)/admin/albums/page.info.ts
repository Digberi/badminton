import { z } from "zod";
import { languages } from "@/i18n/settings";

export const Route = {
  name: "AdminAlbums",
  params: z.object({
    lng: z.enum(languages),
  }),
  meta: {
    title: { ns: "common", key: "nav.albums" },
    menuTitle: { ns: "common", key: "nav.albums" },
    order: 15,
    requiredRoles: ["ADMIN"],
  },
} as const;
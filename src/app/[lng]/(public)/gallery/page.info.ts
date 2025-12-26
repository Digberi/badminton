import {z} from "zod";
import {languages} from "@/i18n/settings";

export const Route = {
  name: "Gallery",
  params: z.object({
    lng: z.enum(languages),
  }),
  meta: {
    title: { ns: "gallery", key: "title" },
    menuTitle: { ns: "common", key: "nav.gallery" },
    order: 10,
  }
} as const;
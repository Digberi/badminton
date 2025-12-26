import { z } from "zod";
import {languages} from "@/i18n/settings";

export const Route = {
  name: "AdminPhotos",
  params: z.object({
    lng: z.enum(languages),
  }),
  meta: {
    title: { ns: "common", key: "nav.photos" },
    menuTitle: { ns: "common", key: "nav.phots" },
    order: 10,
  }
} as const

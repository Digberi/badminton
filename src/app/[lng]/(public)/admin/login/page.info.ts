import { z } from "zod";
import {languages} from "@/i18n/settings";

export const Route = {
  name: "AdminLogin",
  params: z.object({
    lng: z.enum(languages),
  }),
  search: z.object({
    next: z.string().optional(),
    error: z.enum(["unauthorized", "forbidden"]).optional(),
  }),
  meta: {
    title: { ns: "auth", key: "adminLogin.title" },
    hideInMenu: true
  },
} as const;
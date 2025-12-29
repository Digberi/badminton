import { z } from "zod";
import {languages} from "@/i18n/settings";

export const Route = {
  name: "AdminDashboard",
  params: z.object({
    lng: z.enum(languages),
  }),
  meta: {
    title: { ns: "common", key: "nav.dashboard" },
    menuTitle: { ns: "common", key: "nav.dashboard" },
    order: 0,
    requiredRoles: ["ADMIN"],
  },
} as const;
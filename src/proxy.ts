// file: src/proxy.ts
import type { NextFetchEvent, NextRequest } from "next/server";

import { stackProxies } from "@/middlewares/stacker";
import { localizationMiddleware } from "@/middlewares/localization.middleware";
import { adminAuthMiddleware } from "@/middlewares/admin-auth.middleware";

const handler = stackProxies([localizationMiddleware, adminAuthMiddleware]);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handler(request, event);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
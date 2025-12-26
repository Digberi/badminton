import type { NextFetchEvent, NextRequest } from "next/server";

import { stackProxies } from "@/middlewares/stacker";
import { localizationMiddleware } from "@/middlewares/localization.middleware";

const handler = stackProxies([localizationMiddleware]);

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handler(request, event);
}

export const config = {
  matcher: [
    // Exclude api, next internals and files with extensions
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
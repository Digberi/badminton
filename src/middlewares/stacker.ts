import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Internal "stackable proxy middleware" type for Next.js `proxy.ts`.
 *
 * - We create ONE base NextResponse.next() and pass it through the chain.
 * - Each middleware can mutate it (cookies/headers).
 * - If a middleware returns a Response (redirect/rewrite/json/etc) — chain stops.
 */
export type ProxyMiddleware = (
  request: NextRequest,
  response: NextResponse,
  event: NextFetchEvent
) => void | Response | Promise<void | Response>;

export function stackProxies(middlewares: ProxyMiddleware[]) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const response = NextResponse.next();

    for (const mw of middlewares) {
      const out = await mw(request, response, event);
      if (out) return out;
    }

    return response;
  };
}
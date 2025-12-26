import { NextResponse } from "next/server";

import { cookieName, fallbackLng, languages, type Language } from "@/i18n/settings";
import type { ProxyMiddleware } from "@/middlewares/stacker";

function detectFromAcceptLanguage(header: string | null): Language {
  if (!header) return fallbackLng;

  const parts = header.split(",").map((p) => p.trim());
  for (const p of parts) {
    const tag = p.split(";")[0]?.toLowerCase();
    if (!tag) continue;

    const base = tag.split("-")[0] as Language;
    if (languages.includes(base)) return base;
  }

  return fallbackLng;
}

export const localizationMiddleware: ProxyMiddleware = (req, res) => {
  const { pathname } = req.nextUrl;

  // Never touch API routes
  if (pathname.startsWith("/api")) return;

  // Skip obvious file requests (just in case matcher didn't exclude it)
  if (pathname.includes(".") && !pathname.endsWith("/")) return;

  const cookieLng = req.cookies.get(cookieName)?.value as Language | undefined;
  const detected =
    cookieLng && languages.includes(cookieLng)
      ? cookieLng
      : detectFromAcceptLanguage(req.headers.get("accept-language"));

  // If referer contains /{lng}/..., sync cookie to referer language
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const seg = url.pathname.split("/")[1] as Language | undefined;
      if (seg && languages.includes(seg) && cookieLng !== seg) {
        res.cookies.set(cookieName, seg, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        });
      }
    } catch {
      // ignore invalid referer
    }
  }

  const firstSeg = pathname.split("/")[1] as Language | undefined;
  const hasLng = firstSeg && languages.includes(firstSeg);

  if (!hasLng) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${detected}${pathname}`;

    const out = NextResponse.redirect(redirectUrl);
    out.cookies.set(cookieName, detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return out;
  }

  // Keep cookie in sync with URL
  if (firstSeg && cookieLng !== firstSeg) {
    res.cookies.set(cookieName, firstSeg, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
};
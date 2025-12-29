import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import type { ProxyMiddleware } from "@/middlewares/stacker";
import { languages, type Language } from "@/i18n/settings";

function isLanguage(v: string | undefined): v is Language {
  return !!v && (languages as readonly string[]).includes(v);
}

function safeNextPath(path: string) {
  // avoid open redirect: only allow absolute-path on same origin
  return path.startsWith("/") ? path : "/";
}

export const adminAuthMiddleware: ProxyMiddleware = async (req: NextRequest) => {
  const { pathname, search } = req.nextUrl;

  // We only guard /{lng}/admin/*
  const seg = pathname.split("/")[1];
  if (!isLanguage(seg)) return;

  const lng = seg;
  const isAdminArea = pathname.startsWith(`/${lng}/admin`);
  if (!isAdminArea) return;

  // Allow the login page itself
  if (pathname.startsWith(`/${lng}/admin/login`)) return;

  // Read NextAuth JWT from cookies
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = (token as any)?.role as string | undefined;

  if (!token || role !== "ADMIN") {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = `/${lng}/admin/login`;
    loginUrl.searchParams.set("next", safeNextPath(pathname + search));
    loginUrl.searchParams.set("error", !token ? "unauthorized" : "forbidden");
    return NextResponse.redirect(loginUrl);
  }
};
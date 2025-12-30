import "server-only";

import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function requireAdmin(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");

  const token = await getToken({ req, secret });
  const role = (token as any)?.role as string | undefined;

  if (!token) {
    return { ok: false as const, status: 401 as const, error: "UNAUTHORIZED" as const };
  }

  if (role !== "ADMIN") {
    return { ok: false as const, status: 403 as const, error: "FORBIDDEN" as const };
  }

  return {
    ok: true as const,
    userId: token.sub ?? "",
    role: role as "ADMIN",
  };
}
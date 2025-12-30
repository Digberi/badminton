import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type GlobalWithPrisma = typeof globalThis & {
  __prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env (local) / Vercel env vars (prod).");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // При желании можно добавить логирование (оставлю минимально)
    // log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const g = globalThis as GlobalWithPrisma;

export const prisma = g.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  g.__prisma = prisma;
}

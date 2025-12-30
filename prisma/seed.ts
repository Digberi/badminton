import "dotenv/config";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for seed");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // Здесь можешь позже добавить сидинг каких-то системных данных
  console.log("Seed: nothing to seed yet.");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
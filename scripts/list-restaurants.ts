import { config } from "dotenv";
config();
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const rows = await prisma.restaurant.findMany({
    select: { id: true, name: true, _count: { select: { deals: true, locations: true } } },
    orderBy: { name: "asc" },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
  await pool.end();
}
main().catch(console.error);

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDayMap } from "@/lib/deals";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
  const birthday = searchParams.get("birthday") ?? null;

  const deals = await prisma.deal.findMany({
    where: { active: true },
    include: {
      restaurant: { select: { id: true, name: true, website: true } },
      occurrences: { select: { isBirthdayDeal: true, recurrenceRule: true, date: true } },
    },
  });

  const dayMap = buildDayMap(deals, year, month, birthday);

  // Convert Map to plain object for JSON response
  const result: Record<string, typeof deals> = {};
  for (const [key, val] of dayMap) {
    result[key] = val;
  }

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type RestaurantPin = {
  id: string;
  name: string;
  website: string | null;
  category: string;
  locations: { id: string; lat: number; lng: number; address: string | null }[];
  deals: {
    id: string;
    title: string;
    description: string;
    terms: string | null;
    dealType: string;
    tier: number;
    signupType: string;
    signupRequired: boolean;
    signupMethod: string | null;
    validityWindow: unknown;
    marquee: boolean;
    occurrences: {
      isBirthdayDeal: boolean;
      recurrenceRule: string | null;
      date: string | null;
    }[];
  }[];
};

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      locations: { some: {} },
      deals: { some: { active: true } },
    },
    include: {
      locations: {
        select: { id: true, lat: true, lng: true, address: true },
      },
      deals: {
        where: { active: true },
        select: {
          id: true,
          title: true,
          description: true,
          terms: true,
          dealType: true,
          tier: true,
          signupType: true,
          signupRequired: true,
          signupMethod: true,
          validityWindow: true,
          marquee: true,
          occurrences: {
            select: {
              isBirthdayDeal: true,
              recurrenceRule: true,
              date: true,
            },
          },
        },
      },
    },
  });

  const pins: RestaurantPin[] = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    website: r.website,
    category: r.category,
    locations: r.locations,
    deals: r.deals.map((d) => ({
      ...d,
      occurrences: d.occurrences.map((occ) => ({
        ...occ,
        date: occ.date?.toISOString() ?? null,
      })),
    })),
  }));

  return NextResponse.json(pins);
}

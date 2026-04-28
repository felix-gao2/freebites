import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type RestaurantPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  website: string | null;
  deals: {
    id: string;
    title: string;
    description: string;
    terms: string | null;
    dealType: string;
    tier: number;
    signupRequired: boolean;
    signupMethod: string | null;
    validityWindow: string | null;
  }[];
};

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      deals: { some: { active: true } },
    },
    include: {
      deals: {
        where: { active: true },
        select: {
          id: true,
          title: true,
          description: true,
          terms: true,
          dealType: true,
          tier: true,
          signupRequired: true,
          signupMethod: true,
          validityWindow: true,
        },
      },
    },
  });

  const pins: RestaurantPin[] = restaurants
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat!,
      lng: r.lng!,
      website: r.website,
      deals: r.deals,
    }));

  return NextResponse.json(pins);
}

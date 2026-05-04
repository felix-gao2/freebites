import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import * as fs from "fs";
import * as path from "path";

// GTA bounding box: south, west, north, east
const BBOX = "43.4,-80.0,43.95,-79.0";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DELAY_MS = 1000;
const OUT_PATH = path.join(__dirname, "../prisma/locations.json");

type Location = {
  osm_id: number;
  lat: number;
  lng: number;
  address?: string;
};

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

async function queryOverpass(name: string, tag: "brand" | "name"): Promise<Location[]> {
  const escaped = name.replace(/"/g, '\\"');
  const query = `[out:json][timeout:25];
(
  node["${tag}"="${escaped}"](${BBOX});
  way["${tag}"="${escaped}"](${BBOX});
);
out center;`;

  const resp = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!resp.ok) {
    throw new Error(`Overpass returned HTTP ${resp.status} for "${name}" [${tag}]`);
  }

  const data = (await resp.json()) as { elements: OverpassElement[] };

  return data.elements.flatMap((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) return [];

    const tags = el.tags ?? {};
    const addrParts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:city"] ?? tags["addr:suburb"],
    ].filter(Boolean);
    const address = addrParts.length > 0 ? addrParts.join(" ") : undefined;

    const loc: Location = { osm_id: el.id, lat, lng: lon };
    if (address) loc.address = address;
    return [loc];
  });
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log(`Fetching locations for ${restaurants.length} restaurants...\n`);

  const results: Record<string, Location[]> = {};

  for (let i = 0; i < restaurants.length; i++) {
    const { id, name } = restaurants[i];
    process.stdout.write(`[${i + 1}/${restaurants.length}] ${name} ... `);

    let locations: Location[] = [];

    try {
      locations = await queryOverpass(name, "brand");

      // Fallback to name= if brand= returns nothing
      if (locations.length === 0) {
        await sleep(DELAY_MS);
        locations = await queryOverpass(name, "name");
      }
    } catch (err) {
      console.error(`\n  ERROR: ${(err as Error).message}`);
    }

    console.log(`${locations.length} location${locations.length !== 1 ? "s" : ""} found`);
    results[id] = locations;

    // Polite delay between restaurants (skip after last)
    if (i < restaurants.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${OUT_PATH}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

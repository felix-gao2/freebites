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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "freebites-location-fetcher/1.0 (github.com/freebites)",
      "Accept": "*/*",
    },
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

function normalizeName(name: string): string {
  return name.replace(/\s+(Canada|Canadian)\s*$/i, "").trim();
}

function loadExisting(): Record<string, Location[]> {
  if (!fs.existsSync(OUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OUT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const existing = loadExisting();

  // Only retry restaurants that have 0 results (or are missing from existing data)
  const toFetch = restaurants.filter(
    (r) => !existing[r.id] || existing[r.id].length === 0
  );

  console.log(
    `${restaurants.length} total restaurants; ${restaurants.length - toFetch.length} already have results. Fetching ${toFetch.length} with 0 results...\n`
  );

  const results: Record<string, Location[]> = { ...existing };

  for (let i = 0; i < toFetch.length; i++) {
    const { id, name } = toFetch[i];
    const normalized = normalizeName(name);
    const hasAlt = normalized !== name;

    process.stdout.write(`[${i + 1}/${toFetch.length}] ${name} ... `);

    let locations: Location[] = [];

    try {
      // 1. brand= with original name
      locations = await queryOverpass(name, "brand");

      // 2. brand= with normalized name (e.g. strip "Canada")
      if (locations.length === 0 && hasAlt) {
        await sleep(DELAY_MS);
        locations = await queryOverpass(normalized, "brand");
      }

      // 3. name= with original name
      if (locations.length === 0) {
        await sleep(DELAY_MS);
        locations = await queryOverpass(name, "name");
      }

      // 4. name= with normalized name
      if (locations.length === 0 && hasAlt) {
        await sleep(DELAY_MS);
        locations = await queryOverpass(normalized, "name");
      }
    } catch (err) {
      console.error(`\n  ERROR: ${(err as Error).message}`);
    }

    const label = hasAlt ? `${name} → tried "${normalized}"` : name;
    console.log(
      `${locations.length} location${locations.length !== 1 ? "s" : ""} found  [${label}]`
    );
    results[id] = locations;

    if (i < toFetch.length - 1) {
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

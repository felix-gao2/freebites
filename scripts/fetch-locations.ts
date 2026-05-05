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
const DELAY_MS = 3000;
const RATE_LIMIT_WAIT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const MAX_LOCATIONS = 50;
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

  let resp: Response | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    resp = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "freebites-location-fetcher/1.0 (github.com/freebites)",
        "Accept": "*/*",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (resp.status === 429) {
      if (attempt < MAX_ATTEMPTS) {
        process.stdout.write(`\n  429 rate-limited, waiting 30s (attempt ${attempt}/${MAX_ATTEMPTS}) ... `);
        await sleep(RATE_LIMIT_WAIT_MS);
        continue;
      }
      throw new Error(`Overpass returned HTTP 429 for "${name}" [${tag}] after ${MAX_ATTEMPTS} attempts`);
    }

    if (!resp.ok) {
      throw new Error(`Overpass returned HTTP ${resp.status} for "${name}" [${tag}]`);
    }

    break;
  }

  const data = (await resp!.json()) as { elements: OverpassElement[] };

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

// Mulberry32 PRNG — returns a function that yields floats in [0, 1)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let z = Math.imul(seed ^ seed >>> 15, 1 | seed);
    z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
    return ((z ^ z >>> 14) >>> 0) / 0x100000000;
  };
}

// djb2 hash of a string → 32-bit unsigned int
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic partial Fisher-Yates: pick `n` items from `arr` seeded by `seed`
function seededSample<T>(arr: T[], n: number, seed: number): T[] {
  if (arr.length <= n) return arr;
  const a = arr.slice();
  const rand = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
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

    const raw = locations.length;
    if (locations.length > MAX_LOCATIONS) {
      locations = seededSample(locations, MAX_LOCATIONS, hashStr(name));
    }

    const label = hasAlt ? `${name} → tried "${normalized}"` : name;
    const sampledNote = raw > MAX_LOCATIONS ? ` (sampled ${MAX_LOCATIONS}/${raw})` : "";
    console.log(
      `${locations.length} location${locations.length !== 1 ? "s" : ""} found${sampledNote}  [${label}]`
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

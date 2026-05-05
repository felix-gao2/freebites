import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import * as fs from "fs";
import * as path from "path";

const LOCATIONS_PATH = path.join(__dirname, "../prisma/locations.json");

function normalizeKey(name: string): string {
  return name
    .replace(/\s+(Canada|Canadian)\s*$/i, "")
    .toLowerCase()
    .replace(/[''']/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { deals: true, locations: true } },
    },
    orderBy: { name: "asc" },
  });

  // Group by normalized name
  const groups = new Map<string, typeof restaurants>();
  for (const r of restaurants) {
    const key = normalizeKey(r.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const dupeGroups = [...groups.values()].filter((g) => g.length > 1);

  if (dupeGroups.length === 0) {
    console.log("No duplicate restaurants found.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`Found ${dupeGroups.length} duplicate group(s):\n`);

  const locationsJson: Record<string, unknown[]> = fs.existsSync(LOCATIONS_PATH)
    ? JSON.parse(fs.readFileSync(LOCATIONS_PATH, "utf-8"))
    : {};

  for (const group of dupeGroups) {
    // Canonical = most deals; tiebreak = most locations; tiebreak = shorter name
    const sorted = [...group].sort((a, b) => {
      if (b._count.deals !== a._count.deals) return b._count.deals - a._count.deals;
      if (b._count.locations !== a._count.locations) return b._count.locations - a._count.locations;
      return a.name.length - b.name.length;
    });

    const [canonical, ...dupes] = sorted;

    console.log(`Group: "${normalizeKey(canonical.name)}"`);
    console.log(`  KEEP   ${canonical.id.padEnd(24)} "${canonical.name}"  (deals:${canonical._count.deals} locs:${canonical._count.locations})`);

    for (const dupe of dupes) {
      console.log(`  MERGE  ${dupe.id.padEnd(24)} "${dupe.name}"  (deals:${dupe._count.deals} locs:${dupe._count.locations})`);

      // Migrate Deal rows
      const movedDeals = await prisma.deal.updateMany({
        where: { restaurantId: dupe.id },
        data: { restaurantId: canonical.id },
      });

      // Migrate Location rows — skip any whose osmId already exists on canonical
      // to avoid the @unique constraint blowing up
      const dupeLocations = await prisma.location.findMany({
        where: { restaurantId: dupe.id },
        select: { id: true, osmId: true },
      });

      let movedLocs = 0;
      let skippedLocs = 0;
      for (const loc of dupeLocations) {
        if (loc.osmId) {
          const conflict = await prisma.location.findUnique({ where: { osmId: loc.osmId } });
          if (conflict && conflict.restaurantId === canonical.id) {
            // Already on canonical — just delete the dupe
            await prisma.location.delete({ where: { id: loc.id } });
            skippedLocs++;
            continue;
          }
        }
        await prisma.location.update({
          where: { id: loc.id },
          data: { restaurantId: canonical.id },
        });
        movedLocs++;
      }

      console.log(`    → moved ${movedDeals.count} deals, ${movedLocs} locations (${skippedLocs} duplicate locations dropped)`);

      // Merge locations.json entries
      const dupeJsonLocs = locationsJson[dupe.id] ?? [];
      const canonicalJsonLocs = (locationsJson[canonical.id] ?? []) as Array<{ osm_id?: number }>;
      const existingOsmIds = new Set(canonicalJsonLocs.map((l) => l.osm_id));
      let jsonMerged = 0;
      for (const loc of dupeJsonLocs as Array<{ osm_id?: number }>) {
        if (loc.osm_id === undefined || !existingOsmIds.has(loc.osm_id)) {
          canonicalJsonLocs.push(loc);
          if (loc.osm_id !== undefined) existingOsmIds.add(loc.osm_id);
          jsonMerged++;
        }
      }
      locationsJson[canonical.id] = canonicalJsonLocs;
      delete locationsJson[dupe.id];
      console.log(`    → merged ${jsonMerged} locations.json entries`);

      // Delete the duplicate restaurant (deals/locations already moved)
      await prisma.restaurant.delete({ where: { id: dupe.id } });
      console.log(`    → deleted restaurant "${dupe.name}" (${dupe.id})`);
    }

    console.log();
  }

  fs.writeFileSync(LOCATIONS_PATH, JSON.stringify(locationsJson, null, 2));
  console.log(`locations.json updated.`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

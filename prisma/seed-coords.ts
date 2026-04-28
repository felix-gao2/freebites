/**
 * One-off script: patch restaurant lat/lng in Neon.
 * Chains → approximate downtown Toronto centroid (maps shows GTA-wide presence).
 * Location-specific → real coords.
 * Run once: npx tsx prisma/seed-coords.ts
 */
import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

let prisma: PrismaClient;

const COORDS: Record<string, { lat: number; lng: number }> = {
  // GTA centroid (downtown Toronto) for chain-wide presence
  starbucks:          { lat: 43.6532, lng: -79.3832 },
  timhortons:         { lat: 43.6510, lng: -79.3470 },
  secondcup:          { lat: 43.6480, lng: -79.3990 },
  chatime:            { lat: 43.6555, lng: -79.3800 },
  boosterjuice:       { lat: 43.6460, lng: -79.3790 },
  krispykreme:        { lat: 43.7090, lng: -79.3990 },  // Mississauga/Etobicoke area
  lindt:              { lat: 43.6450, lng: -79.3810 },
  crumbl:             { lat: 43.7960, lng: -79.5260 },  // Woodbridge
  cobsbread:          { lat: 43.6520, lng: -79.3880 },
  greatcanadianbagel: { lat: 43.6500, lng: -79.3800 },
  cinnabon:           { lat: 43.6460, lng: -79.3790 },
  mrsub:              { lat: 43.6520, lng: -79.3840 },
  firehousesubs:      { lat: 43.7250, lng: -79.4800 },
  pizzahut:           { lat: 43.6500, lng: -79.3810 },
  harveys:            { lat: 43.6510, lng: -79.3800 },
  "7eleven":          { lat: 43.6540, lng: -79.3820 },
  buffalowildwings:   { lat: 43.7300, lng: -79.7620 },  // Vaughan / Brampton area
  marbleslab:         { lat: 43.6490, lng: -79.3830 },
  menchies:           { lat: 43.6505, lng: -79.3870 },
  baskinrobbins:      { lat: 43.6480, lng: -79.3810 },
  dennys:             { lat: 43.7310, lng: -79.5900 },
  thekeg:             { lat: 43.6450, lng: -79.3920 },
  bostonpizza:        { lat: 43.6510, lng: -79.3850 },
  chipotle:           { lat: 43.6540, lng: -79.3810 },
  dragonpearl:        { lat: 43.7615, lng: -79.3790 },  // North York — real location
  mcdonalds:          { lat: 43.6520, lng: -79.3800 },
  wendys:             { lat: 43.6505, lng: -79.3830 },
  aw:                 { lat: 43.6490, lng: -79.3840 },
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });

  for (const [id, { lat, lng }] of Object.entries(COORDS)) {
    await prisma.restaurant.updateMany({
      where: { id },
      data: { lat, lng },
    });
  }
  console.log(`Updated ${Object.keys(COORDS).length} restaurant coordinates.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma?.$disconnect());

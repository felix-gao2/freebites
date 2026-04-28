import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

// prisma initialized inside main() so DATABASE_URL is guaranteed loaded first
let prisma: PrismaClient;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  // ── RESTAURANTS ──────────────────────────────────────────────────────────
  const restaurants = await Promise.all([
    // birthday tier-1 chains
    upsert("starbucks",          "Starbucks Canada",           "https://www.starbucks.ca"),
    upsert("timhortons",         "Tim Hortons",                "https://www.timhortons.ca"),
    upsert("secondcup",          "Second Cup",                 "https://www.secondcup.com"),
    upsert("chatime",            "Chatime",                    "https://www.chatime.ca"),
    upsert("boosterjuice",       "Booster Juice",              "https://www.boosterjuice.com"),
    upsert("krispykreme",        "Krispy Kreme Canada",        "https://www.krispykreme.ca"),
    upsert("lindt",              "Lindt",                      "https://www.lindtcanada.ca"),
    upsert("crumbl",             "Crumbl Cookies",             "https://crumblcookies.com"),
    upsert("cobsbread",          "COBS Bread",                 "https://www.cobsbread.com"),
    upsert("greatcanadianbagel", "The Great Canadian Bagel",   "https://www.greatcanadianbagel.com"),
    upsert("cinnabon",           "Cinnabon",                   "https://www.cinnabon.ca"),
    upsert("mrsub",              "Mr. Sub",                    "https://www.mrsub.ca"),
    upsert("firehousesubs",      "Firehouse Subs",             "https://www.firehousesubs.ca"),
    upsert("pizzahut",           "Pizza Hut Canada",           "https://www.pizzahut.ca"),
    upsert("harveys",            "Harvey's",                   "https://www.harveys.ca"),
    upsert("7eleven",            "7-Eleven Canada",            "https://www.7-eleven.ca"),
    upsert("buffalowildwings",   "Buffalo Wild Wings",         "https://www.buffalowildwings.ca"),
    upsert("marbleslab",         "Marble Slab Creamery",       "https://www.marbleslab.ca"),
    upsert("menchies",           "Menchie's",                  "https://www.menchies.com"),
    upsert("baskinrobbins",      "Baskin-Robbins Canada",      "https://www.baskinrobbins.ca"),
    // birthday tier-2
    upsert("dennys",             "Denny's",                    "https://www.dennys.com"),
    upsert("thekeg",             "The Keg Steakhouse + Bar",   "https://www.kegsteakhouse.com"),
    upsert("bostonpizza",        "Boston Pizza",               "https://www.bostonpizza.com"),
    upsert("chipotle",           "Chipotle Canada",            "https://www.chipotle.com"),
    upsert("dragonpearl",        "Dragon Pearl Buffet",        null, false),
    // national day placeholders (reuse chains already seeded where applicable)
    upsert("mcdonalds",          "McDonald's Canada",          "https://www.mcdonalds.com/ca"),
    upsert("wendys",             "Wendy's Canada",             "https://www.wendys.com"),
    upsert("aw",                 "A&W Canada",                 "https://www.aw.ca"),
  ]);

  const r = Object.fromEntries(restaurants.map(([key, rec]) => [key, rec]));

  // ── BIRTHDAY DEALS — TIER 1 ───────────────────────────────────────────────
  await seedDeal(r.starbucks.id, {
    title: "Free handcrafted drink or food item",
    description: "Any size handcrafted beverage OR food item free on your birthday.",
    terms: "Starbucks Rewards required. Must sign up ≥7 days before birthday and have ≥1 transaction in the past year. Valid on birthday only.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.timhortons.id, {
    title: "Free beverage or breakfast sandwich",
    description: "Free eligible beverage OR breakfast sandwich on your birthday.",
    terms: "Tims Rewards required. Birthday must be saved in app. Valid on birthday and the following day.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.secondcup.id, {
    title: "Free birthday drink or treat",
    description: "Free birthday drink or treat at Second Cup.",
    terms: "Café Club app required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.chatime.id, {
    title: "Free regular handcrafted drink",
    description: "Free regular handcrafted drink during your birthday week.",
    terms: "App registration required. Redeemable 7 days before or after birthday.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday week",
    birthday: true,
  });

  await seedDeal(r.boosterjuice.id, {
    title: "Free regular smoothie",
    description: "Free regular smoothie on your birthday.",
    terms: "Account required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.krispykreme.id, {
    title: "Free dozen original glazed + specialty donuts",
    description: "Free dozen donuts (original glazed and specialty) for your birthday.",
    terms: "Valid 30 days starting the day before your birthday. In-store ID or app scan.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday month",
    birthday: true,
  });

  await seedDeal(r.lindt.id, {
    title: "Free 150g Lindor bag",
    description: "Free 150g bag of Lindor chocolates for your birthday.",
    terms: "Coupon valid for one month from birthday date.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "Newsletter",
    validityWindow: "birthday month",
    birthday: true,
  });

  await seedDeal(r.crumbl.id, {
    title: "Free birthday cookie",
    description: "Free cookie on your birthday.",
    terms: "App signup required. Valid 5–6 weeks after birthday. Some location-specific offers (e.g., Woodbridge).",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday month",
    birthday: true,
  });

  await seedDeal(r.cobsbread.id, {
    title: "Free birthday treat",
    description: "Free treat from COBS Bread on your birthday.",
    terms: "App required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.greatcanadianbagel.id, {
    title: "Free half-dozen bagels",
    description: "Free half-dozen bagels on your birthday (excludes Super Bagels).",
    terms: "Bagel Birthday Club signup required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "Newsletter",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.cinnabon.id, {
    title: "Free 16oz cold brew on birthday + 4-count BonBites at signup",
    description: "Free 16oz cold brew on your birthday. Also receive free 4-count BonBites just for signing up.",
    terms: "Cinnabon Rewards required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.mrsub.id, {
    title: "Free 6-inch signature sandwich",
    description: "Free 6-inch signature sandwich on your birthday.",
    terms: "App required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.firehousesubs.id, {
    title: "Free regular sandwich",
    description: "Free regular sandwich on your birthday.",
    terms: "Show photo ID in-store.",
    dealType: "birthday", tier: 1, signupRequired: false, signupMethod: "Show ID",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.pizzahut.id, {
    title: "Free breadsticks",
    description: "Free breadsticks on your birthday — no purchase required.",
    terms: "Hut Rewards required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.harveys.id, {
    title: "Free birthday item (typically Frings)",
    description: "Free birthday item on your birthday.",
    terms: "Burger Boss rewards app required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r["7eleven"].id, {
    title: "Free Slurpee during birthday month",
    description: "Free Slurpee any time during your birthday month.",
    terms: "7-Eleven app required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday month",
    birthday: true,
  });

  await seedDeal(r.buffalowildwings.id, {
    title: "Free wings during birthday month",
    description: "Free wings any time during your birthday month — no purchase required. One of the best deals on this list.",
    terms: "Blazin' Rewards required. No purchase necessary.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday month",
    birthday: true,
  });

  await seedDeal(r.marbleslab.id, {
    title: "Free ice cream scoop",
    description: "Free scoop of ice cream on your birthday.",
    terms: "App required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.menchies.id, {
    title: "$5 frozen yogurt coupon",
    description: "$5 frozen yogurt coupon on your birthday (self-serve, often functionally covers a full cup).",
    terms: "My Smileage email signup required.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "Newsletter",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.baskinrobbins.id, {
    title: "Free kiddie scoop",
    description: "Free kiddie scoop of ice cream on your birthday.",
    terms: "Rewards signup required. Also $5 off birthday cakes 20+.",
    dealType: "birthday", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  // ── BIRTHDAY DEALS — TIER 2 ───────────────────────────────────────────────
  await seedDeal(r.dennys.id, {
    title: "Free Grand Slam Breakfast (with drink purchase)",
    description: "Free Grand Slam Breakfast with the purchase of a drink.",
    terms: "Valid photo ID required. Dine-in only at select GTA locations.",
    dealType: "birthday", tier: 2, signupRequired: false, signupMethod: "Show ID",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.thekeg.id, {
    title: "Free Billy Miner Pie slice (with meal purchase)",
    description: "Free slice of Billy Miner Pie with purchase of any meal.",
    terms: "Newsletter signup required. Dine-in only. Doesn't have to be exact birthday — valid around birthday.",
    dealType: "birthday", tier: 2, signupRequired: true, signupMethod: "Newsletter",
    validityWindow: "birthday week",
    birthday: true,
  });

  await seedDeal(r.bostonpizza.id, {
    title: "Free birthday dessert (with meal purchase)",
    description: "Free dessert with meal purchase on your birthday.",
    terms: "MyBP signup required. Also free starter at signup and free pizza on account anniversary.",
    dealType: "birthday", tier: 2, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.chipotle.id, {
    title: "Free chips & guac, queso, or salsa",
    description: "Free chips & guac, queso blanco, or salsa with a $5+ minimum purchase.",
    terms: "Chipotle Rewards required. Minimum $5 purchase.",
    dealType: "birthday", tier: 2, signupRequired: true, signupMethod: "App",
    validityWindow: "birthday only",
    birthday: true,
  });

  await seedDeal(r.dragonpearl.id, {
    title: "Free lobster treat (with adult buffet purchase)",
    description: "Free lobster treat all birthday month with adult buffet purchase. North York location.",
    terms: "Must purchase adult buffet. Valid entire birthday month.",
    dealType: "birthday", tier: 2, signupRequired: false, signupMethod: "Show ID",
    validityWindow: "birthday month",
    birthday: true,
  });

  // ── NATIONAL FOOD DAYS ────────────────────────────────────────────────────
  await seedDeal(r.chipotle.id, {
    title: "National Burrito Day — free burrito vault game + deals",
    description: "Chipotle Burrito Vault game with free burritos for a year as prizes. Multiple chains participate.",
    terms: "Chipotle Rewards participation typically required. Verify current-year offer before Apr 2.",
    dealType: "national_day", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "specific date",
    birthday: false,
    recurrenceRule: "yearly:04-02",
  });

  await seedDeal(r.krispykreme.id, {
    title: "National Doughnut Day — free donut",
    description: "Free donut on National Doughnut Day (first Friday of June). Tim Hortons also historically participates.",
    terms: "Krispy Kreme Rewards often required. Verify current-year participation.",
    dealType: "national_day", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "specific date",
    birthday: false,
    recurrenceRule: "yearly:june-first-friday",
  });

  await seedDeal(r["7eleven"].id, {
    title: "7-Eleven Day — free Slurpee",
    description: "Free Slurpee on July 11 (7/11). Massive GTA 7-Eleven coverage. Genuinely free — no purchase.",
    terms: "7-Eleven app typically required. Valid July 11.",
    dealType: "national_day", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "specific date",
    birthday: false,
    recurrenceRule: "yearly:07-11",
  });

  await seedDeal(r.mcdonalds.id, {
    title: "National Cheeseburger Day — free or discounted burger",
    description: "McDonald's, Wendy's, and A&W historically run promos on National Cheeseburger Day (Sept 18).",
    terms: "Varies by chain and year. Verify current-year participation before Sept 18.",
    dealType: "national_day", tier: 2, signupRequired: false, signupMethod: "App",
    validityWindow: "specific date",
    birthday: false,
    recurrenceRule: "yearly:09-18",
  });

  await seedDeal(r.timhortons.id, {
    title: "National Coffee Day — free coffee",
    description: "Tim Hortons, Starbucks, and McDonald's historically offer free coffee on National Coffee Day (Sept 29).",
    terms: "Tims Rewards typically required for Tim Hortons. Verify current-year offers before Sept 29.",
    dealType: "national_day", tier: 1, signupRequired: true, signupMethod: "App",
    validityWindow: "specific date",
    birthday: false,
    recurrenceRule: "yearly:09-29",
  });

  console.log("Seed complete — 30 deals inserted.");
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function upsert(
  key: string,
  name: string,
  website: string | null,
  gtaLocations = true,
): Promise<[string, { id: string }]> {
  const rec = await prisma.restaurant.upsert({
    where: { id: key },
    create: { id: key, name, website, gtaLocations },
    update: { name, website, gtaLocations },
    select: { id: true },
  });
  return [key, rec];
}

type DealSeed = {
  title: string;
  description: string;
  terms?: string;
  dealType: "birthday" | "national_day" | "recurring" | "one_off";
  tier: number;
  signupRequired: boolean;
  signupMethod?: string;
  validityWindow?: string;
  birthday: boolean;
  recurrenceRule?: string;
};

async function seedDeal(restaurantId: string, d: DealSeed) {
  const deal = await prisma.deal.create({
    data: {
      restaurantId,
      title: d.title,
      description: d.description,
      terms: d.terms,
      dealType: d.dealType,
      tier: d.tier,
      signupRequired: d.signupRequired,
      signupMethod: d.signupMethod,
      validityWindow: d.validityWindow,
      active: true,
      lastVerified: new Date("2026-04-28"),
      occurrences: {
        create: {
          isBirthdayDeal: d.birthday,
          recurrenceRule: d.recurrenceRule ?? null,
          date: null,
        },
      },
    },
  });
  return deal;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma?.$disconnect());

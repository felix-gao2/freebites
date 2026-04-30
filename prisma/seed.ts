import { config } from "dotenv";
config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import type { ValidityWindow } from "../lib/computeValidityRange";

let prisma: PrismaClient;

const TODAY = new Date("2026-04-29");

// ── RESTAURANT DEFINITIONS ────────────────────────────────────────────────────

type Category =
  | "coffee_drinks"
  | "bakeries_sweets"
  | "fast_food"
  | "sit_down"
  | "ice_cream"
  | "convenience";

const RESTAURANTS: Array<[string, string, Category, string]> = [
  // [id, name, category, website]

  // Coffee & Drinks
  ["starbucks",         "Starbucks Canada",          "coffee_drinks",   "https://www.starbucks.ca/"],
  ["timhortons",        "Tim Hortons",               "coffee_drinks",   "https://www.timhortons.ca/"],
  ["secondcup",         "Second Cup",                "coffee_drinks",   "https://secondcup.com/en/"],
  ["chatime",           "Chatime",                   "coffee_drinks",   "https://chatime.ca/"],
  ["boosterjuice",      "Booster Juice",             "coffee_drinks",   "https://boosterjuice.com/"],
  ["jugojuice",         "Jugo Juice",                "coffee_drinks",   "https://jugojuice.com/"],
  ["thealley",          "The Alley",                 "coffee_drinks",   "https://www.the-alley.ca/"],
  ["tptea",             "TP Tea",                    "coffee_drinks",   "https://en.tp-tea.com/"],
  ["tenrenstea",        "Ten Ren's Tea",             "coffee_drinks",   "https://www.tenren.com/"],
  ["villagejuicery",    "Village Juicery",           "coffee_drinks",   "https://www.villagejuicery.com/"],
  ["impactkitchen",     "Impact Kitchen",            "coffee_drinks",   "https://www.impactkitchen.com/"],
  ["davidstea",         "DAVIDsTEA",                 "coffee_drinks",   "https://davidstea.com/"],
  ["goodearthcoffee",   "Good Earth Coffeehouse",    "coffee_drinks",   "https://goodearthcoffeehouse.com/"],

  // Bakeries & Sweets
  ["krispykreme",       "Krispy Kreme Canada",       "bakeries_sweets", "https://krispykreme.ca/"],
  ["lindt",             "Lindt",                     "bakeries_sweets", "https://www.lindt.ca/en/"],
  ["crumbl",            "Crumbl",                    "bakeries_sweets", "https://crumblcookies.ca/"],
  ["cobsbread",         "COBS Bread",                "bakeries_sweets", "https://www.cobsbread.com/"],
  ["greatcanadianbagel","The Great Canadian Bagel",  "bakeries_sweets", "https://greatcanadianbagel.com/"],
  ["kettlemansbagel",   "Kettleman's Bagel",         "bakeries_sweets", "https://www.kettlemansbagels.ca/"],
  ["cinnabon",          "Cinnabon",                  "bakeries_sweets", "https://cinnabon.ca/"],
  ["panerabread",       "Panera Bread",              "bakeries_sweets", "https://panera.ca/"],
  ["nothingbundtcakes", "Nothing Bundt Cakes",       "bakeries_sweets", "https://www.nothingbundtcakes.com/"],
  ["mrpuffs",           "Mr. Puffs",                 "bakeries_sweets", "https://mrpuffs.com/en"],
  ["thenightbaker",     "The Night Baker",           "bakeries_sweets", "https://thenightbaker.com/"],
  ["marrymemochi",      "Marry Me Mochi",            "bakeries_sweets", "https://www.marrymemochi.ca/"],
  ["mrpretzels",        "Mr. Pretzels",              "bakeries_sweets", "https://www.mrpretzels.ca/"],

  // Fast Food & Quick Service
  ["mrsub",             "Mr. Sub",                   "fast_food",       "https://mrsub.ca/"],
  ["firehousesubs",     "Firehouse Subs",            "fast_food",       "https://www.firehousesubs.com/"],
  ["dominos",           "Domino's",                  "fast_food",       "https://www.dominos.ca/"],
  ["harveys",           "Harvey's",                  "fast_food",       "https://www.harveys.ca/"],
  ["marybrownschicken", "Mary Brown's Chicken",      "fast_food",       "https://marybrowns.com/"],
  ["pizzahut",          "Pizza Hut Canada",          "fast_food",       "https://www.pizzahut.ca/"],
  ["papajohns",         "Papa John's Canada",        "fast_food",       "https://www.papajohns.ca/"],
  ["chungchun",         "Chung Chun",                "fast_food",       "https://chungchunricedog.ca/"],
  ["afuriramen",        "Afuri Ramen",               "fast_food",       "https://www.afuriramen.com/"],
  ["villamadina",       "Villa Madina",              "fast_food",       "https://villamadina.com/"],
  ["freshii",           "Freshii",                   "fast_food",       "https://freshii.com/"],
  ["mongafriedchicken", "Monga Fried Chicken",       "fast_food",       "https://mongacanada.com/"],
  ["jerseymikes",       "Jersey Mike's",             "fast_food",       "https://www.jerseymikes.ca/"],
  ["eggclub",           "Egg Club",                  "fast_food",       "https://eggclub.ca/"],

  // Convenience
  ["7eleven",           "7-Eleven Canada",           "convenience",     "https://www.7-eleven.ca/"],

  // Ice Cream & Frozen
  ["marbleslab",        "Marble Slab Creamery",      "ice_cream",       "https://www.marbleslab.ca/"],
  ["ihalokrunch",       "iHalo Krunch",              "ice_cream",       "https://www.ihalokrunch.com/"],
  ["menchies",          "Menchie's",                 "ice_cream",       "https://www.menchies.com/"],
  ["baskinrobbins",     "Baskin-Robbins Canada",     "ice_cream",       "https://www.baskinrobbins.ca/"],
  ["torotoro",          "Toro Toro",                 "ice_cream",       "https://www.torotoro.ca/"],

  // Sit-Down — Tier 1
  ["buffalowildwings",  "Buffalo Wild Wings",        "sit_down",        "https://www.buffalowildwings.com/"],

  // Sit-Down — Tier 2
  ["dennys",            "Denny's",                   "sit_down",        "https://www.dennys.ca/"],
  ["thekeg",            "The Keg",                   "sit_down",        "https://thekeg.com/en"],
  ["bostonpizza",       "Boston Pizza",              "sit_down",        "https://bostonpizza.com/en/index.html"],
  ["montanas",          "Montana's",                 "sit_down",        "https://www.montanas.ca/"],
  ["kelseys",           "Kelseys",                   "sit_down",        "https://www.kelseys.ca/"],
  ["eastsidemarios",    "East Side Mario's",         "sit_down",        "https://www.eastsidemarios.com/"],
  ["lonestargrill",     "Lone Star Texas Grill",     "sit_down",        "https://lonestartexasgrill.com/"],
  ["redlobster",        "Red Lobster",               "sit_down",        "https://www.redlobster.ca/"],
  ["applebees",         "Applebee's",                "sit_down",        "https://www.applebees.com/en"],
  ["mandarin",          "Mandarin Restaurant",       "sit_down",        "https://mandarinrestaurant.com/"],
  ["moxies",            "Moxies",                    "sit_down",        "https://moxies.com/"],
  ["pacini",            "Pacini",                    "sit_down",        "https://pacini.com/en/"],
  ["dragonpearl",       "Dragon Pearl Buffet",       "sit_down",        "https://www.dragonpearlbuffet.com/"],

  // Fast Food — Tier 2
  ["subway",            "Subway",                    "fast_food",       "https://www.subway.com/en-ca/"],
  ["quiznos",           "Quiznos",                   "fast_food",       "https://www.quiznos.ca/en/"],
  ["chipotle",          "Chipotle Canada",           "fast_food",       "https://www.chipotle.com/"],
  ["southstburger",     "South St. Burger",          "fast_food",       "https://southstreetburger.com/"],

  // Ice Cream — Tier 2
  ["dairyqueen",        "Dairy Queen Canada",        "ice_cream",       "https://www.dairyqueen.com/en-us/"],

  // National Food Days placeholder (no map pin — lat/lng are null)
  ["national_days",     "National Food Days",        "fast_food",       ""],
];

// ── DEAL DEFINITIONS ──────────────────────────────────────────────────────────

type DealRow = {
  restaurantId: string;
  title: string;
  description: string;
  terms: string | null;
  dealType?: "birthday" | "national_day";
  tier: 1 | 2;
  signupRequired: boolean;
  signupMethod: string | null;
  validityWindow?: ValidityWindow;
  marquee?: boolean;
  recurrenceRule?: string;
  sourceUrl: string | null;
};

function deals(r: Record<string, { id: string }>): DealRow[] {
  return [
    // ── COFFEE & DRINKS ─────────────────────────────────────────────────────
    {
      restaurantId: r.starbucks.id,
      title: "Free handcrafted drink or food item",
      description: "Any size handcrafted beverage, food item, or bottled drink free on your birthday.",
      terms: "Starbucks Rewards required. Must sign up ≥7 days before birthday and have ≥1 transaction in the past year. Valid on birthday only.",
      tier: 1, signupRequired: true, signupMethod: "Starbucks Rewards app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.starbucks.ca/",
    },
    {
      restaurantId: r.timhortons.id,
      title: "Free beverage or breakfast sandwich",
      description: "Free eligible beverage OR breakfast sandwich during your birthday window.",
      terms: "Tims Rewards required. Appears 2 days before birthday, valid until 8am the day after.",
      tier: 1, signupRequired: true, signupMethod: "Tims Rewards app",
      validityWindow: { type: "days_around", before: 2, after: 1 },
      sourceUrl: "https://www.timhortons.ca/",
    },
    {
      restaurantId: r.secondcup.id,
      title: "Free birthday drink or treat",
      description: "Free birthday drink or treat at Second Cup.",
      terms: "Café Club app required.",
      tier: 1, signupRequired: true, signupMethod: "Café Club app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://secondcup.com/en/",
    },
    {
      restaurantId: r.chatime.id,
      title: "Free regular handcrafted drink",
      description: "Free regular handcrafted drink during your birthday week.",
      terms: "App registration required. Redeemable 7 days before through 7 days after birthday.",
      tier: 1, signupRequired: true, signupMethod: "Chatime app",
      validityWindow: { type: "days_around", before: 7, after: 7 },
      sourceUrl: "https://chatime.ca/",
    },
    {
      restaurantId: r.boosterjuice.id,
      title: "Free regular smoothie",
      description: "Free regular smoothie on your birthday.",
      terms: "Account required.",
      tier: 1, signupRequired: true, signupMethod: "Booster Juice account",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://boosterjuice.com/",
    },
    {
      restaurantId: r.jugojuice.id,
      title: "Free large smoothie",
      description: "Free large smoothie on your birthday.",
      terms: "Email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Email signup",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://jugojuice.com/",
    },
    {
      restaurantId: r.thealley.id,
      title: "Free birthday drink",
      description: "Free birthday drink at The Alley.",
      terms: "Loyalty program required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty program",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.the-alley.ca/",
    },
    {
      restaurantId: r.tptea.id,
      title: "Free regular drink",
      description: "Free regular drink within a week of your birthday.",
      terms: "Fivestars rewards required. Valid within 7 days before birthday.",
      tier: 1, signupRequired: true, signupMethod: "Fivestars rewards",
      validityWindow: { type: "days_around", before: 7, after: 0 },
      sourceUrl: "https://en.tp-tea.com/",
    },
    {
      restaurantId: r.tenrenstea.id,
      title: "Free birthday drink",
      description: "Free birthday drink at Ten Ren's Tea.",
      terms: "Rewards program required.",
      tier: 1, signupRequired: true, signupMethod: "Ten Ren's Rewards",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.tenren.com/",
    },
    {
      restaurantId: r.villagejuicery.id,
      title: "Free cold-pressed juice or smoothie",
      description: "Free cold-pressed juice or smoothie on your birthday.",
      terms: "App and rewards account required.",
      tier: 1, signupRequired: true, signupMethod: "Village Juicery app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.villagejuicery.com/",
    },
    {
      restaurantId: r.impactkitchen.id,
      title: "Free smoothie",
      description: "Free smoothie on your birthday.",
      terms: "Loyalty program required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty program",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.impactkitchen.com/",
    },
    {
      restaurantId: r.davidstea.id,
      title: "5 Steeper points (≈ free cup of tea)",
      description: "5 bonus Steeper points on your birthday, approximately enough for a free cup.",
      terms: "Frequent Steeper club membership required.",
      tier: 1, signupRequired: true, signupMethod: "Frequent Steeper club",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://davidstea.com/",
    },
    {
      restaurantId: r.goodearthcoffee.id,
      title: "Free drink or food item",
      description: "Free drink or food item on your birthday.",
      terms: "Rewards program required.",
      tier: 1, signupRequired: true, signupMethod: "Good Earth Rewards",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://goodearthcoffeehouse.com/",
    },

    // ── BAKERIES & SWEETS ────────────────────────────────────────────────────
    {
      restaurantId: r.krispykreme.id,
      title: "Free dozen donuts (original glazed + specialty)",
      description: "Free dozen donuts (original glazed and specialty) during your 30-day birthday window.",
      terms: "Valid 30 days starting the day before your birthday. In-store ID or app scan required.",
      tier: 1, signupRequired: false, signupMethod: "Show ID or app scan",
      validityWindow: { type: "days_from_birthday", before: 1, days: 30 },
      sourceUrl: "https://krispykreme.ca/",
    },
    {
      restaurantId: r.lindt.id,
      title: "Free 150g Lindor bag",
      description: "Free 150g bag of Lindor chocolates for your birthday.",
      terms: "Email signup required. Coupon valid for one calendar month from birthday date.",
      tier: 1, signupRequired: true, signupMethod: "Email signup",
      validityWindow: { type: "month_from_birthday" },
      sourceUrl: "https://www.lindt.ca/en/",
    },
    {
      restaurantId: r.crumbl.id,
      title: "Free birthday cookie",
      description: "Free cookie during your birthday window (redeemable up to 6 weeks after birthday).",
      terms: "App required. Valid 5–6 weeks after birthday.",
      tier: 1, signupRequired: true, signupMethod: "Crumbl app",
      validityWindow: { type: "weeks_after", weeks: 6 },
      sourceUrl: "https://crumblcookies.ca/",
    },
    {
      restaurantId: r.cobsbread.id,
      title: "Free birthday treat",
      description: "Free treat from COBS Bread on your birthday.",
      terms: "App required.",
      tier: 1, signupRequired: true, signupMethod: "COBS Bread app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.cobsbread.com/",
    },
    {
      restaurantId: r.greatcanadianbagel.id,
      title: "Free half-dozen bagels",
      description: "Free half-dozen bagels on your birthday (excludes Super Bagels).",
      terms: "Bagel Birthday Club signup required.",
      tier: 1, signupRequired: true, signupMethod: "Bagel Birthday Club",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://greatcanadianbagel.com/",
    },
    {
      restaurantId: r.kettlemansbagel.id,
      title: "Free 6 bagels",
      description: "Free 6 bagels on your birthday.",
      terms: "App required.",
      tier: 1, signupRequired: true, signupMethod: "Kettleman's app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.kettlemansbagels.ca/",
    },
    {
      restaurantId: r.cinnabon.id,
      title: "Free 16oz cold brew on birthday + 4-count BonBites at signup",
      description: "Free 16oz cold brew on your birthday. Also get free 4-count BonBites just for signing up.",
      terms: "Cinnabon Rewards required.",
      tier: 1, signupRequired: true, signupMethod: "Cinnabon Rewards app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://cinnabon.ca/",
    },
    {
      restaurantId: r.panerabread.id,
      title: "Free pastry",
      description: "Free pastry on your birthday.",
      terms: "MyPanera Rewards required.",
      tier: 1, signupRequired: true, signupMethod: "MyPanera Rewards",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://panera.ca/",
    },
    {
      restaurantId: r.nothingbundtcakes.id,
      title: "Free bundtlet",
      description: "Free bundtlet (personal-size cake) on your birthday.",
      terms: "Account required.",
      tier: 1, signupRequired: true, signupMethod: "Nothing Bundt Cakes account",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.nothingbundtcakes.com/",
    },
    {
      restaurantId: r.mrpuffs.id,
      title: "6 free donuts",
      description: "6 free Greek loukoumades (donuts) on your birthday.",
      terms: "Loyalty/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://mrpuffs.com/en",
    },
    {
      restaurantId: r.thenightbaker.id,
      title: "1 free cookie",
      description: "1 free cookie on your birthday.",
      terms: "Loyalty/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://thenightbaker.com/",
    },
    {
      restaurantId: r.marrymemochi.id,
      title: "1 free mochi donut",
      description: "1 free mochi donut on your birthday.",
      terms: "Loyalty/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.marrymemochi.ca/",
    },
    {
      restaurantId: r.mrpretzels.id,
      title: "1 free sweet or salty pretzel",
      description: "1 free sweet or salty pretzel on your birthday.",
      terms: "Loyalty/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.mrpretzels.ca/",
    },

    // ── FAST FOOD & QUICK SERVICE ────────────────────────────────────────────
    {
      restaurantId: r.mrsub.id,
      title: "Free 6-inch signature sandwich",
      description: "Free 6-inch signature sandwich on your birthday.",
      terms: "App required.",
      tier: 1, signupRequired: true, signupMethod: "Mr. Sub app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://mrsub.ca/",
    },
    {
      restaurantId: r.firehousesubs.id,
      title: "Free regular sandwich",
      description: "Free regular sandwich on your birthday.",
      terms: "Show photo ID in-store.",
      tier: 1, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.firehousesubs.com/",
    },
    {
      restaurantId: r.dominos.id,
      title: "Free medium 2-topping pizza",
      description: "Free medium 2-topping pizza on your birthday (select GTA locations).",
      terms: "Show photo ID in-store. Select locations only.",
      tier: 1, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.dominos.ca/",
    },
    {
      restaurantId: r.harveys.id,
      title: "Free birthday item (typically Frings)",
      description: "Free birthday item (typically Frings) on your birthday.",
      terms: "Burger Boss rewards app required.",
      tier: 1, signupRequired: true, signupMethod: "Burger Boss app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.harveys.ca/",
    },
    {
      restaurantId: r.marybrownschicken.id,
      title: "Free birthday item",
      description: "Free birthday item from Mary Brown's Chicken on your birthday.",
      terms: "MB app required.",
      tier: 1, signupRequired: true, signupMethod: "Mary Brown's app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://marybrowns.com/",
    },
    {
      restaurantId: r.pizzahut.id,
      title: "Free breadsticks (no purchase required)",
      description: "Free breadsticks on your birthday — no purchase required.",
      terms: "Hut Rewards required.",
      tier: 1, signupRequired: true, signupMethod: "Hut Rewards app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.pizzahut.ca/",
    },
    {
      restaurantId: r.papajohns.id,
      title: "Free birthday cookie",
      description: "Free birthday cookie during your 14-day birthday window.",
      terms: "Papa Rewards app required. Valid on birthday and 13 days after.",
      tier: 1, signupRequired: true, signupMethod: "Papa Rewards app",
      validityWindow: { type: "days_from_birthday", before: 0, days: 14 },
      sourceUrl: "https://www.papajohns.ca/",
    },
    {
      restaurantId: r.chungchun.id,
      title: "Free corn dog",
      description: "Free corn dog on your birthday.",
      terms: "App required.",
      tier: 1, signupRequired: true, signupMethod: "Chung Chun app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://chungchunricedog.ca/",
    },
    {
      restaurantId: r.afuriramen.id,
      title: "Free ramen",
      description: "Free ramen on your birthday.",
      terms: "Show photo ID in-store.",
      tier: 1, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.afuriramen.com/",
    },
    {
      restaurantId: r.villamadina.id,
      title: "Free RokBox or sandwich",
      description: "Free RokBox or sandwich within 5 days of your birthday.",
      terms: "Loyalty program required. Valid 5 days before through 5 days after birthday.",
      tier: 1, signupRequired: true, signupMethod: "Villa Madina loyalty",
      validityWindow: { type: "days_around", before: 5, after: 5 },
      sourceUrl: "https://villamadina.com/",
    },
    {
      restaurantId: r.freshii.id,
      title: "Free item (varies)",
      description: "Free item on your birthday (offer varies by location).",
      terms: "Viip app required.",
      tier: 1, signupRequired: true, signupMethod: "Viip app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://freshii.com/",
    },
    {
      restaurantId: r.mongafriedchicken.id,
      title: "Free Signature Fried Chicken Baoger",
      description: "Free Signature Fried Chicken Baoger on your birthday.",
      terms: "Monga points program required.",
      tier: 1, signupRequired: true, signupMethod: "Monga points program",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://mongacanada.com/",
    },
    {
      restaurantId: r.jerseymikes.id,
      title: "Free sub and drink",
      description: "Free sub and drink on your birthday.",
      terms: "Email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Email signup",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.jerseymikes.ca/",
    },
    {
      restaurantId: r.eggclub.id,
      title: "Free any sandwich",
      description: "Free any sandwich on your birthday.",
      terms: "Loyalty/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "Loyalty/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://eggclub.ca/",
    },

    // ── CONVENIENCE ──────────────────────────────────────────────────────────
    {
      restaurantId: r["7eleven"].id,
      title: "Free Slurpee during birthday month",
      description: "Free Slurpee any day during your entire birthday month.",
      terms: "7-Eleven app required.",
      tier: 1, signupRequired: true, signupMethod: "7-Eleven app",
      validityWindow: { type: "birthday_month" },
      sourceUrl: "https://www.7-eleven.ca/",
    },

    // ── ICE CREAM & FROZEN ───────────────────────────────────────────────────
    {
      restaurantId: r.marbleslab.id,
      title: "Free ice cream scoop",
      description: "Free scoop of ice cream on your birthday.",
      terms: "App required.",
      tier: 1, signupRequired: true, signupMethod: "Marble Slab app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.marbleslab.ca/",
    },
    {
      restaurantId: r.ihalokrunch.id,
      title: "Free cone",
      description: "Free cone on your birthday.",
      terms: "Show photo ID in-store.",
      tier: 1, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.ihalokrunch.com/",
    },
    {
      restaurantId: r.menchies.id,
      title: "$5 frozen yogurt coupon",
      description: "$5 frozen yogurt coupon on your birthday (self-serve — often covers a full cup).",
      terms: "My Smileage email signup required.",
      tier: 1, signupRequired: true, signupMethod: "My Smileage email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.menchies.com/",
    },
    {
      restaurantId: r.baskinrobbins.id,
      title: "Free kiddie scoop",
      description: "Free kiddie scoop of ice cream on your birthday.",
      terms: "Rewards signup required.",
      tier: 1, signupRequired: true, signupMethod: "Baskin-Robbins Rewards",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.baskinrobbins.ca/",
    },
    {
      restaurantId: r.torotoro.id,
      title: "Free medium roll",
      description: "Free medium roll on your birthday.",
      terms: "In-store text/email signup required.",
      tier: 1, signupRequired: true, signupMethod: "In-store text/email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.torotoro.ca/",
    },

    // ── SIT-DOWN (Tier 1) ────────────────────────────────────────────────────
    {
      restaurantId: r.buffalowildwings.id,
      title: "Free 6 wings (traditional or boneless)",
      description: "Free 6 wings (traditional or boneless) any day during your birthday month — no purchase required.",
      terms: "Blazin' Rewards required. No purchase necessary. Valid entire birthday month.",
      tier: 1, signupRequired: true, signupMethod: "Blazin' Rewards app",
      validityWindow: { type: "birthday_month" },
      sourceUrl: "https://www.buffalowildwings.com/",
    },

    // ── SIT-DOWN (Tier 2) ────────────────────────────────────────────────────
    {
      restaurantId: r.dennys.id,
      title: "Free Grand Slam Breakfast (with drink purchase)",
      description: "Free Grand Slam Breakfast with the purchase of a drink on your birthday.",
      terms: "Photo ID required. Dine-in only at select GTA locations.",
      tier: 2, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.dennys.ca/",
    },
    {
      restaurantId: r.thekeg.id,
      title: "Free Billy Miner Pie slice (with meal purchase)",
      description: "Free slice of Billy Miner Pie with any meal purchase around your birthday.",
      terms: "Newsletter signup required. Dine-in only. Valid around your birthday — doesn't have to be exact date.",
      tier: 2, signupRequired: true, signupMethod: "Newsletter",
      validityWindow: { type: "birthday_month" },
      sourceUrl: "https://thekeg.com/en",
    },
    {
      restaurantId: r.bostonpizza.id,
      title: "Free birthday dessert (with meal purchase)",
      description: "Free dessert with any meal purchase on your birthday. Also receive a free starter just for signing up.",
      terms: "MyBP signup required. Dine-in only.",
      tier: 2, signupRequired: true, signupMethod: "MyBP app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://bostonpizza.com/en/index.html",
    },
    {
      restaurantId: r.montanas.id,
      title: "Free dessert + 10% off entire meal",
      description: "Free birthday dessert plus 10% off your entire meal on your birthday (minimum $30 spend).",
      terms: "Grill Lover's Club signup required. Minimum $30 purchase.",
      tier: 2, signupRequired: true, signupMethod: "Grill Lover's Club",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.montanas.ca/",
    },
    {
      restaurantId: r.kelseys.id,
      title: "Free birthday dessert (with meal purchase)",
      description: "Free birthday dessert with any meal purchase on your birthday.",
      terms: "Newsletter signup required.",
      tier: 2, signupRequired: true, signupMethod: "Newsletter",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.kelseys.ca/",
    },
    {
      restaurantId: r.eastsidemarios.id,
      title: "Free pasta (with meal purchase)",
      description: "Free pasta with any meal purchase on your birthday.",
      terms: "Newsletter signup required.",
      tier: 2, signupRequired: true, signupMethod: "Newsletter",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.eastsidemarios.com/",
    },
    {
      restaurantId: r.lonestargrill.id,
      title: "Free dessert (with $30+ purchase)",
      description: "Free dessert on your birthday with a minimum $30 purchase.",
      terms: "The Sizzle rewards required. Minimum $30 spend.",
      tier: 2, signupRequired: true, signupMethod: "The Sizzle rewards",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://lonestartexasgrill.com/",
    },
    {
      restaurantId: r.redlobster.id,
      title: "Free dessert (with purchase)",
      description: "Free dessert with any purchase on your birthday.",
      terms: "Fresh Catch newsletter signup required.",
      tier: 2, signupRequired: true, signupMethod: "Fresh Catch newsletter",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.redlobster.ca/",
    },
    {
      restaurantId: r.applebees.id,
      title: "Free entrée with purchase of another at regular price",
      description: "Free entrée when you buy another at regular price on your birthday. Ajax and select GTA locations.",
      terms: "E-club signup required. Select GTA locations only (Ajax confirmed).",
      tier: 2, signupRequired: true, signupMethod: "E-club",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.applebees.com/en",
    },
    {
      restaurantId: r.mandarin.id,
      title: "Birthday coupon (varies by location)",
      description: "Birthday coupon — offer varies by location. Mandarin Dish signup required at least 2 weeks before birthday.",
      terms: "Mandarin Dish signup required ≥2 weeks before birthday.",
      tier: 2, signupRequired: true, signupMethod: "Mandarin Dish",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://mandarinrestaurant.com/",
    },
    {
      restaurantId: r.moxies.id,
      title: "Complimentary birthday treat (varies)",
      description: "Complimentary birthday treat on your birthday — offer varies by location.",
      terms: "Tell your server. No formal signup required.",
      tier: 2, signupRequired: false, signupMethod: "Tell server",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://moxies.com/",
    },
    {
      restaurantId: r.pacini.id,
      title: "Discount on main course equal to your age (% off)",
      description: "Get a percentage discount on your main course equal to your age on your birthday.",
      terms: "Loyalty program required.",
      tier: 2, signupRequired: true, signupMethod: "Pacini loyalty",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://pacini.com/en/",
    },
    {
      restaurantId: r.dragonpearl.id,
      title: "Free lobster with adult buffet purchase (birthday month)",
      description: "Free lobster treat all birthday month with adult buffet purchase. North York location.",
      terms: "Show photo ID. Must purchase adult buffet. Valid entire birthday month. North York location only.",
      tier: 2, signupRequired: false, signupMethod: "Show ID",
      validityWindow: { type: "birthday_month" },
      sourceUrl: "https://www.dragonpearlbuffet.com/",
    },

    // ── FAST FOOD (Tier 2) ───────────────────────────────────────────────────
    {
      restaurantId: r.subway.id,
      title: "Free item by Star Rewards tier",
      description: "Free birthday item based on your Star Rewards tier: Pro = cookie, Captain = 20oz drink + cookie, Legend = 6-inch sub.",
      terms: "Star Rewards required. Item depends on current tier level.",
      tier: 2, signupRequired: true, signupMethod: "Star Rewards app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.subway.com/en-ca/",
    },
    {
      restaurantId: r.quiznos.id,
      title: "BOGO regular sub",
      description: "Buy one regular sub, get one free within a week of your birthday.",
      terms: "App required. Valid for 7 days starting on birthday.",
      tier: 2, signupRequired: true, signupMethod: "Quiznos app",
      validityWindow: { type: "days_from_birthday", before: 0, days: 7 },
      sourceUrl: "https://www.quiznos.ca/en/",
    },
    {
      restaurantId: r.chipotle.id,
      title: "Free chips & guac, queso blanco, or salsa",
      description: "Free chips & guac, queso blanco, or salsa with a $5+ minimum purchase on your birthday.",
      terms: "Chipotle Rewards required. Minimum $5 purchase.",
      tier: 2, signupRequired: true, signupMethod: "Chipotle Rewards app",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.chipotle.com/",
    },
    {
      restaurantId: r.southstburger.id,
      title: "BOGO — free burger for you and a friend",
      description: "Buy one burger, get one free on your birthday — bring a friend.",
      terms: "Birthday Club email signup required.",
      tier: 2, signupRequired: true, signupMethod: "Birthday Club email",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://southstreetburger.com/",
    },

    // ── ICE CREAM (Tier 2) ───────────────────────────────────────────────────
    {
      restaurantId: r.dairyqueen.id,
      title: "BOGO Blizzard",
      description: "Buy one Blizzard, get one free on your birthday.",
      terms: "Blizzard Fan Club signup required. Excludes Quebec.",
      tier: 2, signupRequired: true, signupMethod: "Blizzard Fan Club",
      validityWindow: { type: "birthday_only" },
      sourceUrl: "https://www.dairyqueen.com/en-us/",
    },

    // ── NATIONAL FOOD DAYS ───────────────────────────────────────────────────
    // Generic (national_days placeholder restaurant)
    {
      restaurantId: r.national_days.id,
      title: "New Year's Day",
      description: "Kick off the new year — many GTA spots run free or BOGO offers on January 1st.",
      terms: "Offers vary by location. Verify before visiting.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:01-01", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Popcorn Day",
      description: "Celebrate the humble kernel — check movie theatres and specialty popcorn shops for free samples.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:01-19", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Pie Day",
      description: "A day for pie lovers — bakeries and cafés around the GTA often offer free slices.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:01-23", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Peanut Butter Day",
      description: "The nuttiest day of January — look for PB-themed freebies at smoothie bars and bakeries.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:01-24", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Croissant Day",
      description: "Flaky, buttery, and free — bakeries often give away croissants to celebrate.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:01-30", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Pizza Day",
      description: "Pizza chains and local spots frequently run free slice or BOGO promotions on February 9th.",
      terms: "Offers vary by location. App or signup may be required at chain restaurants.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:02-09", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Pancake Day",
      description: "Shrove Tuesday — IHOP, Cora, and local diners often serve free pancakes. Date shifts yearly with Easter; the listed date is approximate.",
      terms: "Date varies with the lunar calendar (47 days before Easter). Verify current-year date before visiting.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:02-17", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Margarita Day",
      description: "Bar patrons rejoice — many GTA restaurants and bars offer free or $1 margaritas on February 22nd.",
      terms: "Must be of legal drinking age (19+ in Ontario). Offers vary.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:02-22", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "Pi Day (3.14)",
      description: "Pizza and pie chains celebrate π with BOGO pizzas, free slices, and $3.14 deals on March 14th.",
      terms: "Offers vary. Many pizza chains run same-day app deals.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:03-14", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "St. Patrick's Day",
      description: "Pubs and Irish-themed restaurants around the GTA offer free appetizers, green food, and drink specials.",
      terms: "Must be of legal drinking age (19+ in Ontario) for alcohol promotions.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:03-17", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Ravioli Day",
      description: "Italian restaurants mark the occasion with complimentary pasta bites or pasta-day promotions.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:03-20", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Beer Day",
      description: "Breweries and pubs across the GTA often pour free tasters or run pint specials on April 7th.",
      terms: "Must be of legal drinking age (19+ in Ontario).",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:04-07", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Grilled Cheese Day",
      description: "Sandwich shops and diners celebrate with free or discounted grilled cheese on April 12th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:04-12", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "Cinco de Mayo",
      description: "Mexican chains and restaurants across the GTA run free guac, taco, and drink specials on May 5th.",
      terms: "Offers vary. Alcohol promos require 19+.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:05-05", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Corn on the Cob Day",
      description: "A summer start — street corn vendors and fast-casual spots sometimes run free corn promos.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:06-11", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Sushi Day",
      description: "Sushi restaurants and chains offer complimentary rolls or discounted omakase on June 18th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:06-18", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Sugar Cookie Day",
      description: "Bakeries and cafés hand out free sugar cookies on July 9th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:07-09", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National French Fry Day",
      description: "Fast food chains and burger spots frequently offer free fries on July 13th — often via app.",
      terms: "Offers vary. App or signup may be required.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:07-13", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Ice Cream Day",
      description: "Ice cream shops across the GTA give away free scoops on the third Sunday of July.",
      terms: "Offers vary by location. Some require app signup.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:07-20", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Cheesecake Day",
      description: "Bakeries and dessert spots often serve a free slice of cheesecake on July 30th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:07-30", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Chocolate Chip Cookie Day",
      description: "Cookie shops and cafés celebrate with free chocolate chip cookies on August 4th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:08-04", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Root Beer Float Day",
      description: "A&W Canada has historically offered a free root beer float on August 6th. Confirm before visiting.",
      terms: "A&W historically participates. Verify current-year offer at a&w.ca.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:08-06", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Soft Serve Ice Cream Day",
      description: "Dairy Queen, McDonald's, and soft-serve shops often run free cone promos on August 19th.",
      terms: "Offers vary. Confirm at participating locations.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:08-19", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Waffle Day",
      description: "Waffle houses and breakfast chains celebrate with free or discounted waffles on August 24th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:08-24", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Burger Day",
      description: "Burger chains across the GTA run BOGO or free burger deals on August 27th.",
      terms: "Offers vary. App or signup often required.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:08-27", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Cheese Pizza Day",
      description: "Simple and classic — pizza chains offer free cheese slices or BOGO pies on September 5th.",
      terms: "Offers vary. App or signup may be required.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:09-05", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Guacamole Day",
      description: "Mexican chains offer free guac upgrades or free chips & guac on September 16th.",
      terms: "Offers vary. Chipotle and similar chains often participate.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:09-16", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Pepperoni Pizza Day",
      description: "Pizza chains celebrate pepperoni's reign with free slices and BOGO deals on September 20th.",
      terms: "Offers vary. App or signup may be required.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:09-20", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Dessert Day",
      description: "Bakeries and restaurants across the GTA offer free desserts and sweet samples on October 14th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:10-14", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "Halloween",
      description: "Many GTA chains and cafés run free treats, candy promotions, and costume discounts on October 31st.",
      terms: "Offers vary widely by location. Some require costume.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:10-31", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Sandwich Day",
      description: "Sandwich chains celebrate with free 6-inch subs, BOGO deals, or free add-ons on November 3rd.",
      terms: "Offers vary. App or signup often required at chain restaurants.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:11-03", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "Remembrance Day",
      description: "Many GTA businesses offer free food and drink to veterans and active military on November 11th.",
      terms: "Valid military ID or service proof typically required.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:11-11", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Brownie Day",
      description: "Bakeries and coffee shops hand out free brownies or brownie bites on December 8th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:12-08", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "National Bacon Day",
      description: "Breakfast spots and burger joints celebrate with free bacon add-ons on December 30th.",
      terms: "Offers vary by location.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:12-30", sourceUrl: null,
    },
    {
      restaurantId: r.national_days.id,
      title: "New Year's Eve",
      description: "Bars, restaurants, and venues across the GTA run free appetizers and drink promos to close the year.",
      terms: "Alcohol promos require 19+. Offers vary widely.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:12-31", sourceUrl: null,
    },

    // Marquee national days — specific restaurant deals
    {
      restaurantId: r.chipotle.id,
      title: "National Burrito Day — Free entrée with Chipotle Rewards",
      description: "Chipotle Burrito Vault unlocks a free entrée for Rewards members every National Burrito Day.",
      terms: "Chipotle Rewards required. Check chipotle.com/national-burrito-day for current-year offer details.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: true, signupMethod: "Chipotle Rewards app",
      recurrenceRule: "yearly:04-02",
      sourceUrl: "https://www.chipotle.com/",
    },
    {
      restaurantId: r.mrpretzels.id,
      title: "National Pretzel Day",
      description: "Mr. Pretzels celebrates National Pretzel Day with free or discounted pretzels at GTA mall locations.",
      terms: "Verify participation at your local Mr. Pretzels before visiting.",
      dealType: "national_day", tier: 1, signupRequired: false, signupMethod: null,
      recurrenceRule: "yearly:04-26",
      sourceUrl: "https://www.mrpretzels.ca/",
    },
    {
      restaurantId: r.krispykreme.id,
      title: "National Doughnut Day — Free doughnut",
      description: "Krispy Kreme gives away a free doughnut of your choice to every guest — no purchase required — on National Doughnut Day.",
      terms: "No purchase necessary. One per customer. In-store only at participating locations.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: false, signupMethod: "Walk in",
      recurrenceRule: "yearly:june-first-friday",
      sourceUrl: "https://krispykreme.ca/",
    },
    {
      restaurantId: r.timhortons.id,
      title: "National Doughnut Day — Free doughnut",
      description: "Tim Hortons offers a free doughnut with any beverage purchase on National Doughnut Day (first Friday of June).",
      terms: "Beverage purchase required. Valid at participating GTA Tim Hortons locations.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: false, signupMethod: "Walk in",
      recurrenceRule: "yearly:june-first-friday",
      sourceUrl: "https://www.timhortons.ca/",
    },
    {
      restaurantId: r["7eleven"].id,
      title: "7-Eleven Day — Free Slurpee",
      description: "Every July 11th is 7-Eleven's birthday — walk in and grab a free small Slurpee, no purchase needed.",
      terms: "Free small Slurpee, one per customer. Valid all day at GTA 7-Eleven locations.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: false, signupMethod: "Walk in",
      recurrenceRule: "yearly:07-11",
      sourceUrl: "https://www.7-eleven.ca/",
    },
    {
      restaurantId: r.harveys.id,
      title: "National Cheeseburger Day — Free burger deal",
      description: "Harvey's typically runs a free or BOGO cheeseburger offer via their app on National Cheeseburger Day.",
      terms: "Burger Boss / Burger Lovers rewards app likely required. Confirm offer at harveys.ca.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: true, signupMethod: "Burger Boss app",
      recurrenceRule: "yearly:09-18",
      sourceUrl: "https://www.harveys.ca/",
    },
    {
      restaurantId: r.starbucks.id,
      title: "National Coffee Day — Free or discounted drink",
      description: "Starbucks and other major coffee chains offer free drinks or BOGO promotions on National Coffee Day.",
      terms: "Starbucks Rewards may be required. Confirm current-year offer in the app.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: true, signupMethod: "Starbucks Rewards app",
      recurrenceRule: "yearly:09-29",
      sourceUrl: "https://www.starbucks.ca/",
    },
    {
      restaurantId: r.chipotle.id,
      title: "National Taco Day — Free taco with Chipotle Rewards",
      description: "Chipotle Rewards members get a free taco on National Taco Day — one of the best fast-casual giveaways of the year.",
      terms: "Chipotle Rewards required. Confirm current-year offer at chipotle.com.",
      dealType: "national_day", tier: 1, marquee: true, signupRequired: true, signupMethod: "Chipotle Rewards app",
      recurrenceRule: "yearly:10-04",
      sourceUrl: "https://www.chipotle.com/",
    },
  ];
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });

  // Wipe deals + occurrences so the seed is idempotent
  await prisma.dealOccurrence.deleteMany();
  await prisma.deal.deleteMany();

  // Upsert all restaurants
  const rows = await Promise.all(
    RESTAURANTS.map(([id, name, category, website]) =>
      prisma.restaurant.upsert({
        where: { id },
        create: { id, name, category, website, gtaLocations: true },
        update: { name, category, website, gtaLocations: true },
        select: { id: true },
      }).then((rec) => [id, rec] as [string, { id: string }])
    )
  );
  const r = Object.fromEntries(rows);

  const dealList = deals(r);
  for (const d of dealList) {
    const type = d.dealType ?? "birthday";
    await prisma.deal.create({
      data: {
        restaurantId: d.restaurantId,
        title: d.title,
        description: d.description,
        terms: d.terms,
        dealType: type,
        tier: d.tier,
        marquee: d.marquee ?? false,
        signupRequired: d.signupRequired,
        signupMethod: d.signupMethod,
        validityWindow: d.validityWindow ?? undefined,
        sourceUrl: d.sourceUrl,
        lastVerified: TODAY,
        active: true,
        occurrences: {
          create: d.recurrenceRule
            ? { isBirthdayDeal: false, recurrenceRule: d.recurrenceRule }
            : { isBirthdayDeal: true },
        },
      },
    });
  }

  const bdayT1 = dealList.filter(d => (d.dealType ?? "birthday") === "birthday" && d.tier === 1).length;
  const bdayT2 = dealList.filter(d => (d.dealType ?? "birthday") === "birthday" && d.tier === 2).length;
  const natDays = dealList.filter(d => d.dealType === "national_day").length;
  console.log(`Seed complete — ${RESTAURANTS.length} restaurants, ${bdayT1} Tier 1 + ${bdayT2} Tier 2 birthday deals, ${natDays} national food days.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma?.$disconnect());

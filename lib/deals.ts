import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, getMonth, getDate, getYear } from "date-fns";
import type { DealType } from "@/lib/generated/prisma/enums";

export type DealWithOccurrences = {
  id: string;
  title: string;
  description: string;
  terms: string | null;
  dealType: DealType;
  tier: number;
  signupRequired: boolean;
  signupMethod: string | null;
  validityWindow: string | null;
  sourceUrl: string | null;
  lastVerified: Date | null;
  active: boolean;
  restaurantId: string;
  restaurant: { id: string; name: string; website: string | null };
  occurrences: { isBirthdayDeal: boolean; recurrenceRule: string | null; date: Date | null }[];
};

/**
 * Returns a map of date-string ("YYYY-MM-DD") → deals active on that date.
 * birthday is "YYYY-MM-DD". year/month are the calendar month being rendered.
 */
export function buildDayMap(
  deals: DealWithOccurrences[],
  year: number,
  month: number, // 1-based
  birthday: string | null,
): Map<string, DealWithOccurrences[]> {
  const map = new Map<string, DealWithOccurrences[]>();

  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const [bMonth, bDay] = birthday ? parseBirthday(birthday) : [0, 0];

  for (const deal of deals) {
    for (const occ of deal.occurrences) {
      if (occ.isBirthdayDeal) {
        // show on the birthday date if it falls in this month
        if (bMonth === month && bDay > 0) {
          const key = dateKey(year, month, bDay);
          push(map, key, deal);
        }
        continue;
      }

      if (occ.recurrenceRule) {
        const rule = occ.recurrenceRule;

        if (rule.startsWith("yearly:")) {
          const part = rule.slice("yearly:".length);

          if (part === "june-first-friday") {
            if (month === 6) {
              const d = firstWeekdayOfMonth(year, 6, 5); // 5 = Friday
              push(map, dateKey(year, 6, d), deal);
            }
            continue;
          }

          // "yearly:MM-DD"
          const [mm, dd] = part.split("-").map(Number);
          if (mm === month) {
            push(map, dateKey(year, month, dd), deal);
          }
          continue;
        }

        if (rule.startsWith("weekly:")) {
          const dayName = rule.slice("weekly:".length).toLowerCase();
          const targetDow = DOW_MAP[dayName];
          if (targetDow !== undefined) {
            for (const d of days) {
              if (getDay(d) === targetDow) {
                push(map, toKey(d), deal);
              }
            }
          }
          continue;
        }
      }

      if (occ.date) {
        const d = occ.date;
        if (getMonth(d) + 1 === month && getYear(d) === year) {
          push(map, toKey(d), deal);
        }
      }
    }
  }

  return map;
}

function push(map: Map<string, DealWithOccurrences[]>, key: string, deal: DealWithOccurrences) {
  const arr = map.get(key) ?? [];
  arr.push(deal);
  map.set(key, arr);
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toKey(d: Date) {
  return dateKey(getYear(d), getMonth(d) + 1, getDate(d));
}

function parseBirthday(raw: string): [number, number] {
  const p = raw.split("-");
  return [parseInt(p[1], 10), parseInt(p[2], 10)];
}

function firstWeekdayOfMonth(year: number, month: number, dow: number): number {
  const d = new Date(year, month - 1, 1);
  const diff = (dow - getDay(d) + 7) % 7;
  return 1 + diff;
}

const DOW_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

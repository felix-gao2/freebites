"use client";

import { startOfWeek, endOfWeek, eachDayOfInterval, isToday, format, getMonth, getDate, getYear } from "date-fns";
import type { DealWithOccurrences } from "@/lib/deals";

const TYPE_EMOJI: Record<string, string> = {
  birthday:     "🎂",
  national_day: "📅",
  recurring:    "🔁",
  one_off:      "⚡",
};

const TIER_LABEL: Record<number, string> = {
  1: "Truly free",
  2: "Free with purchase",
  3: "Deal",
};

export default function WeekView({
  cursor,
  birthday,
  dayMap,
  loading,
  onDayClick,
}: {
  cursor: Date;
  birthday: string;
  dayMap: Record<string, DealWithOccurrences[]>;
  loading: boolean;
  onDayClick?: (date: Date) => void;
}) {
  const [bMonth, bDay] = parseBirthday(birthday);
  const days = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });

  return (
    <div className="flex flex-col gap-2" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {days.map((day) => {
        const key = `${getYear(day)}-${String(getMonth(day) + 1).padStart(2, "0")}-${String(getDate(day)).padStart(2, "0")}`;
        const deals = dayMap[key] ?? [];
        const today = isToday(day);
        const isBirthday = getMonth(day) + 1 === bMonth && getDate(day) === bDay;

        return (
          <div
            key={day.toISOString()}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: today ? "var(--color-terracotta)" : "var(--border)" }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
              style={{
                background: today
                  ? "var(--color-terracotta)"
                  : isBirthday
                  ? "oklch(0.97 0.05 50)"
                  : "var(--card)",
              }}
              onClick={() => onDayClick?.(day)}
            >
              <span
                className="text-sm font-bold"
                style={{ color: today ? "var(--color-cream)" : "var(--color-forest)" }}
              >
                {format(day, "EEE d")}
              </span>
              <span
                className="text-xs"
                style={{ color: today ? "rgba(255,255,255,0.7)" : "var(--color-warm-gray)" }}
              >
                {format(day, "MMM yyyy")}
              </span>
              {isBirthday && <span>🎂</span>}
              {deals.length > 0 && (
                <span
                  className="ml-auto text-xs font-medium rounded-full px-2 py-0.5 shrink-0"
                  style={{
                    background: today ? "rgba(255,255,255,0.2)" : "var(--muted)",
                    color: today ? "var(--color-cream)" : "var(--color-warm-gray)",
                  }}
                >
                  {deals.length} deal{deals.length !== 1 ? "s" : ""}
                </span>
              )}
            </button>

            {deals.length > 0 && (
              <div className="px-4 pb-3 pt-2 flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                {deals.map((deal) => (
                  <div key={deal.id} className="flex items-start gap-2 py-2 first:pt-0 last:pb-0">
                    <span className="text-base leading-none mt-0.5 shrink-0">{TYPE_EMOJI[deal.dealType] ?? "🍔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs font-semibold" style={{ color: "var(--color-terracotta)" }}>
                          {deal.restaurant.name}
                        </span>
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-px"
                          style={{
                            background: deal.tier === 1 ? "var(--color-forest)" : "var(--muted)",
                            color: deal.tier === 1 ? "var(--color-cream)" : "var(--color-warm-gray)",
                          }}
                        >
                          {TIER_LABEL[deal.tier] ?? "Deal"}
                        </span>
                      </div>
                      <p className="text-sm leading-snug" style={{ color: "var(--color-forest)" }}>
                        {deal.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function parseBirthday(raw: string): [number, number] {
  const p = raw.split("-");
  return [parseInt(p[1], 10), parseInt(p[2], 10)];
}

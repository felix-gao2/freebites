"use client";

import { isToday, getMonth, getYear } from "date-fns";

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

export default function YearView({
  cursor,
  onMonthClick,
}: {
  cursor: Date;
  onMonthClick: (date: Date) => void;
}) {
  const year = getYear(cursor);
  const now = new Date();
  const thisMonth = getMonth(now);
  const thisYear = getYear(now);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {MONTH_NAMES.map((name, i) => {
        const isCurrentCursor = i === getMonth(cursor);
        const isNow = i === thisMonth && year === thisYear;

        return (
          <button
            key={name}
            onClick={() => onMonthClick(new Date(year, i, 1))}
            className="rounded-xl border p-4 flex flex-col items-center gap-1 transition-colors hover:brightness-95 focus:outline-none"
            style={{
              borderColor: isCurrentCursor
                ? "var(--color-terracotta)"
                : isNow
                ? "var(--color-forest-light)"
                : "var(--border)",
              background: isCurrentCursor
                ? "var(--color-terracotta)"
                : isNow
                ? "oklch(0.97 0.05 50)"
                : "var(--card)",
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{
                color: isCurrentCursor
                  ? "var(--color-cream)"
                  : "var(--color-forest)",
              }}
            >
              {name}
            </span>
            <span
              className="text-xs"
              style={{
                color: isCurrentCursor
                  ? "rgba(255,255,255,0.7)"
                  : "var(--color-warm-gray)",
              }}
            >
              {year}
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  getMonth,
  getDate,
  getYear,
} from "date-fns";
import type { DealWithOccurrences } from "@/lib/deals";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthView({
  cursor,
  birthday,
  dayMap = {},
  loading = false,
  onDayClick,
}: {
  cursor: Date;
  birthday: string;
  dayMap?: Record<string, DealWithOccurrences[]>;
  loading?: boolean;
  onDayClick?: (date: Date) => void;
}) {
  const [bMonth, bDay] = parseBirthday(birthday);

  const gridStart = startOfWeek(startOfMonth(cursor));
  const gridEnd = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-full" style={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}>
      {/* day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-1"
            style={{ color: "var(--color-warm-gray)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const isBirthday =
            inMonth &&
            getMonth(day) + 1 === bMonth &&
            getDate(day) === bDay;

          const key = `${getYear(day)}-${String(getMonth(day) + 1).padStart(2, "0")}-${String(getDate(day)).padStart(2, "0")}`;
          const deals = dayMap[key] ?? [];

          return (
            <DayCell
              key={day.toISOString()}
              day={day}
              inMonth={inMonth}
              today={today}
              isBirthday={isBirthday}
              deals={deals}
              onClick={() => onDayClick?.(day)}
            />
          );
        })}
      </div>
    </div>
  );
}

const DEAL_CHIP_COLORS: Record<string, string> = {
  birthday:     "#C1613A",
  national_day: "#4A7C6B",
  recurring:    "#7A6960",
  one_off:      "#9E4D2C",
};

function DayCell({
  day,
  inMonth,
  today,
  isBirthday,
  deals,
  onClick,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  isBirthday: boolean;
  deals: DealWithOccurrences[];
  onClick: () => void;
}) {
  const label = format(day, "d");

  let bg = "var(--card)";
  if (isBirthday) bg = "oklch(0.97 0.05 50)"; // warm yellow tint
  if (!inMonth) bg = "var(--muted)";

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start p-1.5 min-h-[72px] text-left transition-colors hover:brightness-95 focus:outline-none"
      style={{ background: bg }}
    >
      {/* date number */}
      <span
        className={[
          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
          today ? "text-[var(--color-cream)]" : "",
          !inMonth ? "opacity-35" : "",
        ].join(" ")}
        style={{
          background: today ? "var(--color-terracotta)" : "transparent",
          color: today
            ? "var(--color-cream)"
            : isBirthday
            ? "var(--color-terracotta-dark)"
            : "var(--color-forest)",
          fontWeight: today || isBirthday ? 700 : 500,
        }}
      >
        {label}
      </span>

      {/* birthday badge */}
      {isBirthday && (
        <span className="mt-0.5 text-[10px] leading-none" style={{ color: "var(--color-terracotta)" }}>
          🎂 birthday
        </span>
      )}

      {/* deal chips — max 3, then +N */}
      {inMonth && deals.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {deals.slice(0, 3).map((deal) => (
            <span
              key={deal.id}
              className="inline-block rounded-full px-1.5 py-px text-[9px] font-semibold leading-none text-white truncate max-w-[70px]"
              style={{ background: DEAL_CHIP_COLORS[deal.dealType] ?? "#7A6960" }}
              title={deal.title}
            >
              {deal.restaurant.name.split(" ")[0]}
            </span>
          ))}
          {deals.length > 3 && (
            <span
              className="inline-block rounded-full px-1.5 py-px text-[9px] font-semibold leading-none"
              style={{ background: "var(--muted)", color: "var(--color-warm-gray)" }}
            >
              +{deals.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function parseBirthday(raw: string): [number, number] {
  // raw is "YYYY-MM-DD"
  const parts = raw.split("-");
  return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

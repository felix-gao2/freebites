"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
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

  const isFirstLoad = loading && Object.keys(dayMap).length === 0;

  return (
    <div className="w-full flex flex-col flex-1">
      {/* day-of-week headers */}
      <div className="grid grid-cols-7 mb-1 shrink-0">
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
      <div className="grid grid-cols-7 gap-px flex-1" style={{ background: "var(--border)", gridAutoRows: "1fr" }}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const isBirthday =
            inMonth &&
            getMonth(day) + 1 === bMonth &&
            getDate(day) === bDay;

          const key = `${getYear(day)}-${String(getMonth(day) + 1).padStart(2, "0")}-${String(getDate(day)).padStart(2, "0")}`;
          const deals = dayMap[key] ?? [];
          const isPastDay = inMonth && !today && isBefore(day, startOfDay(new Date()));

          return (
            <DayCell
              key={day.toISOString()}
              day={day}
              inMonth={inMonth}
              today={today}
              isBirthday={isBirthday}
              isPastDay={isPastDay}
              deals={deals}
              skeleton={isFirstLoad && inMonth}
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
  isPastDay,
  deals,
  skeleton,
  onClick,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  isBirthday: boolean;
  isPastDay: boolean;
  deals: DealWithOccurrences[];
  skeleton?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const label = format(day, "d");
  const hasDeals = deals.length > 0;
  const isEmptyInMonth = inMonth && !hasDeals && !skeleton;
  const interactive = hasDeals && inMonth && !isPastDay;

  let bg = "var(--card)";
  if (isBirthday) bg = "oklch(0.97 0.05 50)";
  if (!inMonth) bg = "var(--muted)";
  if (isPastDay) bg = "var(--muted)";
  if (hovered && interactive) bg = "var(--color-cream-dark)";

  return (
    <button
      onClick={interactive ? onClick : undefined}
      onMouseEnter={() => { if (interactive) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-start p-1.5 h-full text-left focus:outline-none"
      style={{
        background: bg,
        boxShadow: isBirthday && !isPastDay ? "inset 0 0 0 3px var(--color-terracotta)" : undefined,
        cursor: interactive ? "pointer" : "default",
        transition: "background 150ms ease",
        opacity: isPastDay ? 0.45 : 1,
      }}
    >
      {/* date number */}
      <span
        className={[
          "text-base w-8 h-8 flex items-center justify-center rounded-full",
          today ? "text-[var(--color-cream)]" : "",
          !inMonth ? "opacity-35" : "",
        ].join(" ")}
        style={{
          background: today ? "var(--color-terracotta)" : "transparent",
          color: today ? "var(--color-cream)" : isBirthday ? "var(--color-terracotta)" : "var(--color-forest)",
          fontWeight: today || isBirthday ? 800 : 500,
          opacity: !inMonth ? undefined : (isEmptyInMonth && !isPastDay) ? 0.45 : undefined,
        }}
      >
        {label}
      </span>

      {/* skeleton shimmer */}
      {inMonth && skeleton && (
        <div className="mt-1.5 w-full flex flex-col gap-1">
          <div className="h-3.5 rounded-full animate-pulse" style={{ background: "var(--border)", width: "72%" }} />
          <div className="h-3.5 rounded-full animate-pulse" style={{ background: "var(--border)", width: "50%", animationDelay: "150ms" }} />
        </div>
      )}

      {/* birthday badge */}
      {!skeleton && isBirthday && (
        <span className="mt-0.5 text-[10px] leading-none" style={{ color: "var(--color-terracotta)" }}>
          🎂 birthday
        </span>
      )}

      {/* mobile: colored dots */}
      {!skeleton && inMonth && deals.length > 0 && (
        <div className="mt-0.5 flex gap-0.5 sm:hidden">
          {deals.slice(0, 4).map((deal) => (
            <div
              key={deal.id}
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: DEAL_CHIP_COLORS[deal.dealType] ?? "#7A6960" }}
            />
          ))}
        </div>
      )}

      {/* desktop: name chips */}
      {!skeleton && inMonth && deals.length > 0 && (
        <div className="mt-1 hidden sm:flex flex-wrap gap-0.5">
          {deals.slice(0, 5).map((deal) => (
            <span
              key={deal.id}
              className="inline-block rounded-full px-1.5 py-px text-[9px] font-semibold leading-none text-white truncate max-w-[80px]"
              style={{ background: DEAL_CHIP_COLORS[deal.dealType] ?? "#7A6960" }}
              title={deal.title}
            >
              {deal.marquee ? "★ " : ""}{chipLabel(deal)}
            </span>
          ))}
          {deals.length > 5 && (
            <span
              className="inline-block rounded-full px-1.5 py-px text-[9px] font-semibold leading-none"
              style={{ background: "var(--muted)", color: "var(--color-warm-gray)" }}
            >
              +{deals.length - 5}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function chipLabel(deal: DealWithOccurrences): string {
  if (deal.dealType === "national_day") {
    return deal.title
      .replace(/^National /, "")
      .replace(/ Day.*$/, "")
      .split(" ").slice(0, 2).join(" ");
  }
  return deal.restaurant.name.split(" ")[0];
}

function parseBirthday(raw: string): [number, number] {
  // raw is "YYYY-MM-DD"
  const parts = raw.split("-");
  return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

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
} from "date-fns";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthView({
  cursor,
  birthday,
  onDayClick,
}: {
  cursor: Date;
  birthday: string;
  onDayClick?: (date: Date) => void;
}) {
  const [bMonth, bDay] = parseBirthday(birthday);

  const gridStart = startOfWeek(startOfMonth(cursor));
  const gridEnd = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="w-full">
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

          return (
            <DayCell
              key={day.toISOString()}
              day={day}
              inMonth={inMonth}
              today={today}
              isBirthday={isBirthday}
              onClick={() => onDayClick?.(day)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  inMonth,
  today,
  isBirthday,
  onClick,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  isBirthday: boolean;
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
          🎂 your birthday
        </span>
      )}
    </button>
  );
}

function parseBirthday(raw: string): [number, number] {
  // raw is "YYYY-MM-DD"
  const parts = raw.split("-");
  return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

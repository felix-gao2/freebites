"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, getMonth, getYear } from "date-fns";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import type { DealWithOccurrences } from "@/lib/deals";
import DayModal from "@/components/calendar/DayModal";

export type CalendarView = "month" | "week" | "year";

export default function CalendarPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [dayMap, setDayMap] = useState<Record<string, DealWithOccurrences[]>>({});
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) {
      router.replace("/");
      return;
    }
    setBirthday(saved);
  }, [router]);

  const fetchDeals = useCallback(
    async (date: Date, bday: string, currentView: CalendarView) => {
      setLoadingDeals(true);

      const months: Array<{ y: number; m: number }> = [{ y: getYear(date), m: getMonth(date) + 1 }];

      if (currentView === "week") {
        const wStart = startOfWeek(date);
        const wEnd = endOfWeek(date);
        if (getMonth(wStart) !== getMonth(date)) {
          months.unshift({ y: getYear(wStart), m: getMonth(wStart) + 1 });
        }
        if (getMonth(wEnd) !== getMonth(date)) {
          months.push({ y: getYear(wEnd), m: getMonth(wEnd) + 1 });
        }
      }

      const results = await Promise.all(
        months.map(({ y, m }) =>
          fetch(`/api/deals?year=${y}&month=${m}&birthday=${bday}`).then((r) => r.json()),
        ),
      );

      setDayMap(Object.assign({}, ...results));
      setLoadingDeals(false);
    },
    [],
  );

  useEffect(() => {
    if (birthday) fetchDeals(cursor, birthday, view);
  }, [birthday, cursor, view, fetchDeals]);

  if (!birthday) return null;

  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
      ? `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d, yyyy")}`
      : format(cursor, "yyyy");

  function prev() {
    setCursor((c) => view === "week" ? subWeeks(c, 1) : subMonths(c, 1));
  }
  function next() {
    setCursor((c) => view === "week" ? addWeeks(c, 1) : addMonths(c, 1));
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* top nav */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--color-terracotta)" }}
        >
          freebites
        </span>

        {/* view toggle */}
        <div
          className="flex rounded-lg overflow-hidden border text-sm font-medium"
          style={{ borderColor: "var(--border)" }}
        >
          {(["month", "week", "year"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 capitalize transition-colors"
              style={{
                background:
                  view === v ? "var(--color-terracotta)" : "var(--card)",
                color:
                  view === v ? "var(--color-cream)" : "var(--color-warm-gray)",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/map" className="text-sm font-medium" style={{ color: "var(--color-forest)" }}>
            Map
          </Link>
          <button
            className="text-xs underline"
            style={{ color: "var(--color-warm-gray)" }}
            onClick={() => {
              localStorage.removeItem(BIRTHDAY_KEY);
              router.push("/");
            }}
          >
            change birthday
          </button>
        </div>
      </header>

      {/* month navigator */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={prev}
          className="text-lg px-2"
          style={{ color: "var(--color-forest)" }}
          aria-label="previous"
        >
          ‹
        </button>
        <span className="font-semibold text-base" style={{ color: "var(--color-forest)" }}>
          {title}
        </span>
        <button
          onClick={next}
          className="text-lg px-2"
          style={{ color: "var(--color-forest)" }}
          aria-label="next"
        >
          ›
        </button>
      </div>

      {/* calendar body */}
      <div className="flex-1 p-4">
        {view === "month" && (
          <MonthView
            cursor={cursor}
            birthday={birthday}
            dayMap={dayMap}
            loading={loadingDeals}
            onDayClick={setSelectedDay}
          />
        )}
        {view === "week" && (
          <WeekView
            cursor={cursor}
            birthday={birthday}
            dayMap={dayMap}
            loading={loadingDeals}
            onDayClick={setSelectedDay}
          />
        )}
        {view === "year" && (
          <div className="flex items-center justify-center h-40" style={{ color: "var(--color-warm-gray)" }}>
            Year view coming soon
          </div>
        )}
      </div>

      {/* day detail modal */}
      {selectedDay && (
        <DayModal
          date={selectedDay}
          deals={(() => {
            const y = getYear(selectedDay);
            const m = getMonth(selectedDay) + 1;
            const d = selectedDay.getDate();
            const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            return dayMap[key] ?? [];
          })()}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

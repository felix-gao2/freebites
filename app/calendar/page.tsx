"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, subMonths, getMonth, getYear } from "date-fns";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MonthView from "@/components/calendar/MonthView";
import type { DealWithOccurrences } from "@/lib/deals";

export type CalendarView = "month" | "week" | "year";

export default function CalendarPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [dayMap, setDayMap] = useState<Record<string, DealWithOccurrences[]>>({});
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) {
      router.replace("/");
      return;
    }
    setBirthday(saved);
  }, [router]);

  const fetchDeals = useCallback(
    async (date: Date, bday: string) => {
      setLoadingDeals(true);
      const y = getYear(date);
      const m = getMonth(date) + 1;
      const res = await fetch(`/api/deals?year=${y}&month=${m}&birthday=${bday}`);
      const data = await res.json();
      setDayMap(data);
      setLoadingDeals(false);
    },
    [],
  );

  useEffect(() => {
    if (birthday) fetchDeals(cursor, birthday);
  }, [birthday, cursor, fetchDeals]);

  if (!birthday) return null;

  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
      ? `Week of ${format(cursor, "MMM d, yyyy")}`
      : format(cursor, "yyyy");

  function prev() {
    setCursor((c) => (view === "month" ? subMonths(c, 1) : subMonths(c, 1)));
  }
  function next() {
    setCursor((c) => (view === "month" ? addMonths(c, 1) : addMonths(c, 1)));
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

        {/* clear birthday */}
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
          />
        )}
        {view === "week" && (
          <div className="flex items-center justify-center h-40" style={{ color: "var(--color-warm-gray)" }}>
            Week view coming soon
          </div>
        )}
        {view === "year" && (
          <div className="flex items-center justify-center h-40" style={{ color: "var(--color-warm-gray)" }}>
            Year view coming soon
          </div>
        )}
      </div>
    </div>
  );
}

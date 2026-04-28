"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addMonths, subMonths, getMonth, getYear } from "date-fns";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MonthView from "@/components/calendar/MonthView";
import type { DealWithOccurrences } from "@/lib/deals";
import DayModal from "@/components/calendar/DayModal";

export default function CalendarPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
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
    async (date: Date, bday: string) => {
      setLoadingDeals(true);
      const y = getYear(date);
      const m = getMonth(date) + 1;
      const res = await fetch(`/api/deals?year=${y}&month=${m}&birthday=${bday}`);
      setDayMap(await res.json());
      setLoadingDeals(false);
    },
    [],
  );

  useEffect(() => {
    if (birthday) fetchDeals(cursor, birthday);
  }, [birthday, cursor, fetchDeals]);

  if (!birthday) return null;

  const title = format(cursor, "MMMM yyyy");

  function prev() { setCursor((c) => subMonths(c, 1)); }
  function next() { setCursor((c) => addMonths(c, 1)); }

  return (
    <div className="flex flex-col min-h-screen">
      {/* top nav */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <span className="text-2xl font-black tracking-tighter leading-none">
          <span style={{ color: "var(--color-terracotta)" }}>free</span>
          <span style={{ color: "var(--color-forest)" }}>bites</span>
        </span>

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
        <MonthView
          cursor={cursor}
          birthday={birthday}
          dayMap={dayMap}
          loading={loadingDeals}
          onDayClick={setSelectedDay}
        />
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

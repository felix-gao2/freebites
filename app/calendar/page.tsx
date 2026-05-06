"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { format, addMonths, subMonths, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Map, Cake, CakeSlice, CalendarDays } from "lucide-react";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MonthView from "@/components/calendar/MonthView";
import type { DealWithOccurrences } from "@/lib/deals";
import DayModal from "@/components/calendar/DayModal";

export default function CalendarPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
  const [cursor, setCursor] = useState(new Date());
  const directionRef = useRef(1);
  const [dayMap, setDayMap] = useState<Record<string, DealWithOccurrences[]>>({});
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) { router.replace("/"); return; }
    setBirthday(saved);
  }, [router]);

  const fetchDeals = useCallback(async (date: Date, bday: string) => {
    setLoadingDeals(true);
    const y = getYear(date);
    const m = getMonth(date) + 1;
    const res = await fetch(`/api/deals?year=${y}&month=${m}&birthday=${bday}`);
    setDayMap(await res.json());
    setLoadingDeals(false);
  }, []);

  useEffect(() => {
    if (birthday) fetchDeals(cursor, birthday);
  }, [birthday, cursor, fetchDeals]);

  function resetCalendar() {
    setCursor(new Date());
  }

  if (!birthday) return null;

  const todayLabel = format(new Date(), "EEEE, MMMM d");

  // Parse birthday month (1-based) from stored "YYYY-MM-DD"
  const bdayMonth = parseInt(birthday.split("-")[1], 10) - 1; // 0-based for date-fns
  const now = new Date();
  // Jump to this year's birthday month; if already past, go to next year's
  const bdayTarget = bdayMonth < now.getMonth()
    ? setMonth(setYear(now, now.getFullYear() + 1), bdayMonth)
    : setMonth(now, bdayMonth);
  const onBdayMonth =
    getMonth(cursor) === bdayMonth &&
    getYear(cursor) === getYear(bdayTarget);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── navbar ── */}
      <header
        className="px-6 py-4 border-b shrink-0 flex items-center justify-between"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
        }}
      >
        {/* left: logo — resets to today */}
        <button
          onClick={resetCalendar}
          className="text-3xl font-black tracking-tighter leading-none"
        >
          <span style={{ color: "var(--color-terracotta)" }}>free</span>
          <span style={{ color: "var(--color-forest)" }}>bites</span>
        </button>

        {/* right: actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold border transition-all duration-150 hover:bg-[var(--color-cream)]"
            style={{
              borderColor: "var(--color-terracotta)",
              color: "var(--foreground)",
              background: "transparent",
            }}
          >
            <Map size={14} strokeWidth={2} />
            Map view
          </Link>
          <button
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold border transition-all duration-150 hover:bg-[var(--color-cream)]"
            style={{
              borderColor: "var(--color-terracotta)",
              color: "var(--foreground)",
              background: "transparent",
            }}
            onClick={() => { localStorage.removeItem(BIRTHDAY_KEY); router.push("/"); }}
          >
            <Cake size={14} strokeWidth={2} />
            Change birthday
          </button>
        </div>
      </header>

      {/* ── month navigator ── */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={() => { directionRef.current = -1; setCursor((c) => subMonths(c, 1)); }}
          disabled={getMonth(cursor) === getMonth(now) && getYear(cursor) === getYear(now)}
          className="text-xl px-3 py-1 rounded-lg transition-colors hover:bg-[var(--muted)] disabled:opacity-25 disabled:pointer-events-none"
          style={{ color: "var(--color-forest)" }}
          aria-label="previous month"
        >
          ‹
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-semibold text-base" style={{ color: "var(--color-forest)" }}>
            {format(cursor, "MMMM yyyy")}
          </span>
          <p className="text-base font-medium" style={{ color: "var(--color-warm-gray)" }}>
            Your free food calendar for the GTA
          </p>
          <p className="text-sm" style={{ color: "var(--color-warm-gray)", opacity: 0.55 }}>
            Today is {todayLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { directionRef.current = 1; setCursor((c) => addMonths(c, 1)); }}
            className="text-xl px-3 py-1 rounded-lg transition-colors hover:bg-[var(--muted)]"
            style={{ color: "var(--color-forest)" }}
            aria-label="next month"
          >
            ›
          </button>
          <button
            onClick={() => { directionRef.current = now > cursor ? 1 : -1; setCursor(new Date()); }}
            disabled={getMonth(cursor) === getMonth(now) && getYear(cursor) === getYear(now)}
            className="p-1.5 rounded-lg transition-all duration-150 hover:bg-[var(--muted)] disabled:opacity-0 disabled:pointer-events-none"
            style={{ color: "var(--color-forest)" }}
            aria-label="Jump to today"
            title="Back to today"
          >
            <CalendarDays size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => { directionRef.current = bdayTarget > cursor ? 1 : -1; setCursor(bdayTarget); }}
            disabled={onBdayMonth}
            className="p-1.5 rounded-lg transition-all duration-150 hover:bg-[var(--muted)] disabled:opacity-0 disabled:pointer-events-none"
            style={{ color: "var(--color-terracotta)" }}
            aria-label="Jump to birthday month"
            title="Jump to your birthday month"
          >
            <CakeSlice size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── calendar body ── */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={format(cursor, "yyyy-MM")}
            initial={{ opacity: 0, x: directionRef.current * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: directionRef.current * -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <MonthView
              cursor={cursor}
              birthday={birthday}
              dayMap={dayMap}
              loading={loadingDeals}
              onDayClick={setSelectedDay}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── day modal ── */}
      <AnimatePresence>
        {selectedDay && (
          <DayModal
            date={selectedDay}
            birthday={birthday}
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
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [tierFilter, setTierFilter] = useState<Set<number>>(new Set());

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

  const filteredDayMap = useMemo(() => {
    if (tierFilter.size === 0) return dayMap;
    const out: Record<string, DealWithOccurrences[]> = {};
    for (const [key, deals] of Object.entries(dayMap)) {
      const filtered = deals.filter((d) => tierFilter.has(d.tier));
      if (filtered.length) out[key] = filtered;
    }
    return out;
  }, [dayMap, tierFilter]);

  function toggleTier(tier: number) {
    setTierFilter((prev) => {
      const next = new Set(prev);
      next.has(tier) ? next.delete(tier) : next.add(tier);
      return next;
    });
  }

  function resetCalendar() {
    setCursor(new Date());
    setTierFilter(new Set());
  }

  if (!birthday) return null;

  const FILTERS = [
    { tier: 1, label: "Truly Free" },
    { tier: 2, label: "Free with Purchase" },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── navbar ── */}
      <header
        className="flex items-center gap-4 px-6 py-4 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        {/* logo — resets to today */}
        <button
          onClick={resetCalendar}
          className="text-3xl font-black tracking-tighter leading-none shrink-0"
        >
          <span style={{ color: "var(--color-terracotta)" }}>free</span>
          <span style={{ color: "var(--color-forest)" }}>bites</span>
        </button>

        {/* divider */}
        <div className="h-6 w-px shrink-0" style={{ background: "var(--border)" }} />

        {/* tier filter pills */}
        <div className="flex items-center gap-2 shrink-0">
          {FILTERS.map(({ tier, label }) => {
            const active = tierFilter.has(tier);
            return (
              <button
                key={tier}
                onClick={() => toggleTier(tier)}
                className="rounded-full px-3 py-1.5 text-sm font-medium border transition-colors"
                style={{
                  background: active
                    ? tier === 1 ? "var(--color-forest)" : "var(--color-terracotta)"
                    : "transparent",
                  color: active ? "var(--color-cream)" : "var(--color-warm-gray)",
                  borderColor: active
                    ? tier === 1 ? "var(--color-forest)" : "var(--color-terracotta)"
                    : "var(--border)",
                }}
              >
                {active ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>

        {/* tagline — center fill */}
        <p className="flex-1 text-center text-sm" style={{ color: "var(--color-warm-gray)" }}>
          Your free food calendar for the GTA · filter deals above · switch to map →
        </p>

        {/* right actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/map"
            className="rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors"
            style={{
              borderColor: "var(--color-forest)",
              color: "var(--color-forest)",
            }}
          >
            Map view →
          </Link>
          <button
            className="text-sm font-medium underline-offset-2 underline"
            style={{ color: "var(--color-warm-gray)" }}
            onClick={() => { localStorage.removeItem(BIRTHDAY_KEY); router.push("/"); }}
          >
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
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="text-xl px-3 py-1 rounded-lg transition-colors hover:bg-[var(--muted)]"
          style={{ color: "var(--color-forest)" }}
          aria-label="previous month"
        >
          ‹
        </button>
        <span className="font-semibold text-base" style={{ color: "var(--color-forest)" }}>
          {format(cursor, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="text-xl px-3 py-1 rounded-lg transition-colors hover:bg-[var(--muted)]"
          style={{ color: "var(--color-forest)" }}
          aria-label="next month"
        >
          ›
        </button>
      </div>

      {/* ── calendar body ── */}
      <div className="flex-1 p-4">
        <MonthView
          cursor={cursor}
          birthday={birthday}
          dayMap={filteredDayMap}
          loading={loadingDeals}
          onDayClick={setSelectedDay}
        />
      </div>

      {/* ── day modal ── */}
      {selectedDay && (
        <DayModal
          date={selectedDay}
          deals={(() => {
            const y = getYear(selectedDay);
            const m = getMonth(selectedDay) + 1;
            const d = selectedDay.getDate();
            const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            return filteredDayMap[key] ?? [];
          })()}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

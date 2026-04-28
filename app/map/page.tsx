"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MapView from "@/components/map/MapView";

export type MapFilter = "all" | "today" | "week" | "birthday";

export default function MapPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>("all");

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) { router.replace("/"); return; }
    setBirthday(saved);
  }, [router]);

  if (!birthday) return null;

  const filters: { key: MapFilter; label: string }[] = [
    { key: "all",      label: "All deals" },
    { key: "today",    label: "Today" },
    { key: "week",     label: "This week" },
    { key: "birthday", label: "My birthday" },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <span className="text-xl font-bold tracking-tight" style={{ color: "var(--color-terracotta)" }}>
          freebites
        </span>
        <Link
          href="/calendar"
          className="text-sm font-medium"
          style={{ color: "var(--color-forest)" }}
        >
          ← Calendar
        </Link>
      </header>

      {/* filter bar */}
      <div
        className="flex gap-2 px-4 py-3 border-b overflow-x-auto shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors"
            style={{
              background: filter === key ? "var(--color-terracotta)" : "transparent",
              color: filter === key ? "var(--color-cream)" : "var(--color-warm-gray)",
              borderColor: filter === key ? "var(--color-terracotta)" : "var(--border)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* map fills remaining space */}
      <div className="flex-1 relative">
        <MapView birthday={birthday} filter={filter} />
      </div>
    </div>
  );
}

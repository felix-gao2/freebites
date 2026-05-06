"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Cake } from "lucide-react";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MapView from "@/components/map/MapView";

export type TierFilter     = "all" | "truly_free" | "with_purchase";
export type SignupFilter    = "all" | "no_prep";
export type CategoryFilter = "all" | "coffee_drinks" | "bakeries_sweets" | "fast_food" | "sit_down" | "ice_cream" | "convenience";

export type MapFilter = {
  tier: TierFilter;
  signup: SignupFilter;
  category: CategoryFilter;
  search: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  coffee_drinks:   "Coffee & Drinks",
  bakeries_sweets: "Bakeries & Sweets",
  fast_food:       "Fast Food",
  sit_down:        "Sit-Down",
  ice_cream:       "Ice Cream",
  convenience:     "Convenience",
};

const ALL_CATEGORIES: CategoryFilter[] = [
  "coffee_drinks", "bakeries_sweets", "fast_food", "sit_down", "ice_cream", "convenience",
];

export default function MapPage() {
  const router = useRouter();
  const [birthday, setBirthday] = useState<string | null>(null);
  const [tier, setTier]         = useState<TierFilter>("all");
  const [signup, setSignup]     = useState<SignupFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch]       = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) { router.replace("/"); return; }
    setBirthday(saved);
  }, [router]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchRaw), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchRaw]);

  if (!birthday) return null;

  const isAll = tier === "all" && signup === "all" && category === "all" && !search.trim();

  function resetAll() {
    setTier("all");
    setSignup("all");
    setCategory("all");
    setSearchRaw("");
  }

  const filter: MapFilter = { tier, signup, category, search };

  return (
    <div className="flex flex-col h-screen">
      {/* header */}
      <header
        className="px-5 py-4 border-b shrink-0"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderColor: "var(--border)",
          background: "var(--card)",
        }}
      >
        {/* left: logo */}
        <Link
          href="/calendar"
          className="text-3xl font-black tracking-tighter leading-none justify-self-start"
        >
          <span style={{ color: "var(--color-terracotta)" }}>free</span>
          <span style={{ color: "var(--color-forest)" }}>bites</span>
        </Link>

        {/* center: tagline */}
        <p className="text-base font-medium" style={{ color: "var(--color-warm-gray)" }}>
          Your free food calendar for the GTA
        </p>

        {/* right: actions */}
        <div className="flex items-center gap-2 justify-end">
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold border transition-all duration-150 hover:bg-[var(--color-cream)]"
            style={{
              borderColor: "var(--color-terracotta)",
              color: "var(--foreground)",
              background: "transparent",
            }}
          >
            <CalendarDays size={14} strokeWidth={2} />
            Calendar
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

      {/* filter bar — search left of chips on sm+, stacked on mobile */}
      <div
        className="shrink-0 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="px-4 pt-3 pb-1.5 sm:py-3 sm:pr-2 shrink-0">
            <SearchInput value={searchRaw} onChange={setSearchRaw} />
          </div>

          <div className="hidden sm:block shrink-0 h-4 w-px" style={{ background: "var(--border)" }} />

          {/* Chips row */}
          <div
            className="flex items-center gap-2.5 px-4 pb-3 sm:py-3 sm:px-3 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <Chip label="All" active={isAll} onClick={resetAll} />
            <Chip label="Truly Free"         active={tier === "truly_free"}    onClick={() => setTier(tier === "truly_free"    ? "all" : "truly_free")} />
            <Chip label="Free with Purchase" active={tier === "with_purchase"} onClick={() => setTier(tier === "with_purchase" ? "all" : "with_purchase")} />

            <Sep />

            <Chip label="No prep needed" active={signup === "no_prep"} onClick={() => setSignup(signup === "no_prep" ? "all" : "no_prep")} />

            <Sep />

            {ALL_CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={CATEGORY_LABELS[cat]}
                active={category === cat}
                onClick={() => setCategory(category === cat ? "all" : cat)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* map fills remaining space */}
      <div className="flex-1 relative">
        <MapView birthday={birthday} filter={filter} onClearFilters={resetAll} />
      </div>
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 w-full sm:w-48 transition-colors"
      style={{
        borderColor: focused ? "var(--color-terracotta)" : "var(--border)",
        background: "transparent",
      }}
    >
      {/* magnifying glass */}
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0"
        style={{ color: focused ? "var(--color-terracotta)" : "var(--color-warm-gray)", transition: "color 150ms" }}
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search restaurants…"
        className="flex-1 bg-transparent outline-none text-sm min-w-0 placeholder:text-sm"
        style={{
          color: "var(--foreground)",
        }}
      />

      {value && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onChange(""); }}
          className="shrink-0 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ color: "var(--color-warm-gray)" }}
          aria-label="Clear search"
        >
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-sm font-medium rounded-full px-4 py-1.5 border whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
      style={{
        borderColor: active ? "var(--color-terracotta)" : "var(--border)",
        background:  active ? "var(--color-terracotta)" : "transparent",
        color:       active ? "var(--color-cream)"      : "var(--color-warm-gray)",
      }}
    >
      {label}
    </button>
  );
}

function Sep() {
  return (
    <div className="shrink-0 h-4 w-px mx-0.5" style={{ background: "var(--border)" }} />
  );
}

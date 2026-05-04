"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BIRTHDAY_KEY } from "@/components/BirthdayForm";
import MapView from "@/components/map/MapView";

export type TierFilter     = "all" | "truly_free" | "with_purchase";
export type SignupFilter    = "all" | "no_prep";
export type CategoryFilter = "all" | "coffee_drinks" | "bakeries_sweets" | "fast_food" | "sit_down" | "ice_cream" | "convenience";

export type MapFilter = {
  tier: TierFilter;
  signup: SignupFilter;
  category: CategoryFilter;
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

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (!saved) { router.replace("/"); return; }
    setBirthday(saved);
  }, [router]);

  if (!birthday) return null;

  const isAll = tier === "all" && signup === "all" && category === "all";

  function resetAll() {
    setTier("all");
    setSignup("all");
    setCategory("all");
  }

  const filter: MapFilter = { tier, signup, category };

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
        className="flex items-center gap-2.5 px-4 py-3 border-b overflow-x-auto shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--card)", scrollbarWidth: "none" }}
      >
        {/* All (master reset) */}
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

      {/* map fills remaining space */}
      <div className="flex-1 relative">
        <MapView birthday={birthday} filter={filter} />
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-sm font-medium rounded-full px-4 py-1.5 border whitespace-nowrap transition-colors"
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

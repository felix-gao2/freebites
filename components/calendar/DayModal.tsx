"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { DealWithOccurrences } from "@/lib/deals";

type TierFilter   = "all" | "truly_free" | "with_purchase";
type SignupFilter  = "all" | "no_prep" | "app" | "newsletter";
type CategoryFilter = "all" | "coffee_drinks" | "bakeries_sweets" | "fast_food" | "sit_down" | "ice_cream" | "convenience";

const TIER_LABEL: Record<number, string> = {
  1: "Truly free",
  2: "Free with purchase",
  3: "Deal",
};

const SIGNUP_TYPE_LABEL: Record<string, string> = {
  no_signup:   "No signup",
  show_id:     "Show ID",
  app:         "App needed",
  rewards:     "Rewards member",
  newsletter:  "Newsletter",
  loyalty:     "Loyalty program",
};

const TYPE_EMOJI: Record<string, string> = {
  birthday:     "🎂",
  national_day: "📅",
  recurring:    "🔁",
  one_off:      "⚡",
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

const SIGNUP_ORDER = ["no_signup", "show_id", "app", "rewards", "newsletter", "loyalty"];

export default function DayModal({
  date,
  deals,
  onClose,
}: {
  date: Date;
  deals: DealWithOccurrences[];
  onClose: () => void;
}) {
  const [tier, setTier]         = useState<TierFilter>("all");
  const [signup, setSignup]     = useState<SignupFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [catOpen, setCatOpen]   = useState(false);
  const dropdownRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [catOpen]);

  // Deals after tier + signup filters (used to compute category counts)
  const tierSignupFiltered = useMemo(() => deals.filter((d) => {
    if (tier === "truly_free"    && d.tier !== 1) return false;
    if (tier === "with_purchase" && d.tier !== 2) return false;
    if (signup === "no_prep"    && d.signupType !== "no_signup" && d.signupType !== "show_id") return false;
    if (signup === "app"        && d.signupType !== "app") return false;
    if (signup === "newsletter" && d.signupType !== "newsletter") return false;
    return true;
  }), [deals, tier, signup]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of tierSignupFiltered) {
      counts[d.restaurant.category] = (counts[d.restaurant.category] ?? 0) + 1;
    }
    return counts;
  }, [tierSignupFiltered]);

  const filtered = useMemo(() => {
    if (category === "all") return tierSignupFiltered;
    return tierSignupFiltered.filter((d) => d.restaurant.category === category);
  }, [tierSignupFiltered, category]);

  // Groups: one entry per non-empty category, deals sorted by signup difficulty
  const groups = useMemo(() => {
    const visibleCats = category === "all" ? ALL_CATEGORIES : [category];
    return visibleCats
      .map((cat) => ({
        cat,
        deals: filtered
          .filter((d) => d.restaurant.category === cat)
          .sort((a, b) => SIGNUP_ORDER.indexOf(a.signupType) - SIGNUP_ORDER.indexOf(b.signupType)),
      }))
      .filter((g) => g.deals.length > 0);
  }, [filtered, category]);

  const filterKey = `${tier}-${signup}-${category}`;
  const filtersActive = tier !== "all" || signup !== "all" || category !== "all";

  function clearFilters() {
    setTier("all");
    setSignup("all");
    setCategory("all");
  }

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-xl flex flex-col max-h-[80vh]"
        style={{ background: "var(--card)" }}
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-warm-gray)" }}>
              {format(date, "EEEE")}
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold" style={{ color: "var(--color-forest)" }}>
                {format(date, "MMMM d, yyyy")}
              </h2>
              {deals.length > 0 && (
                <span className="text-sm" style={{ color: "var(--color-warm-gray)" }}>
                  {filtersActive
                    ? `${filtered.length} of ${deals.length}`
                    : `${deals.length} deal${deals.length !== 1 ? "s" : ""}`}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-1"
            style={{ color: "var(--color-warm-gray)" }}
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* filter row */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b overflow-x-auto shrink-0"
          style={{ borderColor: "var(--border)", scrollbarWidth: "none" }}
        >
          {/* Tier */}
          <Chip label="All"                active={tier === "all"}           onClick={() => setTier("all")} />
          <Chip label="Truly Free"         active={tier === "truly_free"}    onClick={() => setTier("truly_free")} />
          <Chip label="Free with Purchase" active={tier === "with_purchase"} onClick={() => setTier("with_purchase")} />

          <Sep />

          {/* Signup */}
          <Chip label="All"              active={signup === "all"}       onClick={() => setSignup("all")} />
          <Chip label="No prep needed"   active={signup === "no_prep"}   onClick={() => setSignup("no_prep")} />
          <Chip label="App required"     active={signup === "app"}       onClick={() => setSignup("app")} />
          <Chip label="Newsletter"       active={signup === "newsletter"} onClick={() => setSignup("newsletter")} />

          <Sep />

          {/* Category dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border transition-colors whitespace-nowrap"
              style={{
                borderColor: category !== "all" ? "var(--color-terracotta)" : "var(--border)",
                background:  category !== "all" ? "var(--color-terracotta)" : "transparent",
                color:       category !== "all" ? "var(--color-cream)"      : "var(--color-warm-gray)",
              }}
            >
              {category === "all" ? "All categories" : CATEGORY_LABELS[category]}
              <span style={{ fontSize: 9, opacity: 0.7 }}>{catOpen ? "▲" : "▼"}</span>
            </button>

            <AnimatePresence>
              {catOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full mb-2 left-0 rounded-xl border shadow-lg z-10 py-1 min-w-[190px]"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <DropdownItem
                    label="All categories"
                    active={category === "all"}
                    count={tierSignupFiltered.length}
                    onClick={() => { setCategory("all"); setCatOpen(false); }}
                  />
                  {ALL_CATEGORIES.filter((cat) => (categoryCounts[cat] ?? 0) > 0).map((cat) => (
                    <DropdownItem
                      key={cat}
                      label={CATEGORY_LABELS[cat]}
                      active={category === cat}
                      count={categoryCounts[cat] ?? 0}
                      onClick={() => { setCategory(cat); setCatOpen(false); }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* deal list */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={filterKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col gap-4"
            >
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="text-4xl">🔍</span>
                  <p className="text-sm font-medium" style={{ color: "var(--color-warm-gray)" }}>
                    No deals match these filters
                  </p>
                  <button
                    className="text-xs underline mt-1"
                    style={{ color: "var(--color-terracotta)" }}
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                groups.map(({ cat, deals: groupDeals }) => (
                  <div key={cat} className="flex flex-col gap-2">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wider pt-1"
                      style={{ color: "var(--color-warm-gray)" }}
                    >
                      {CATEGORY_LABELS[cat]} ({groupDeals.length})
                    </p>
                    {groupDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 text-xs font-medium rounded-full px-3 py-1 border whitespace-nowrap transition-colors"
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
    <div
      className="shrink-0 h-4 w-px mx-0.5"
      style={{ background: "var(--border)" }}
    />
  );
}

function DropdownItem({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-opacity hover:opacity-70"
      style={{
        color:      active ? "var(--color-terracotta)" : "var(--color-forest)",
        fontWeight: active ? 600 : 400,
      }}
    >
      <span>{label}</span>
      <span className="ml-4 tabular-nums" style={{ color: "var(--color-warm-gray)" }}>{count}</span>
    </button>
  );
}

function DealCard({ deal }: { deal: DealWithOccurrences }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1.5"
      style={{ borderColor: "var(--border)", background: "var(--background)" }}
    >
      {/* type + tier + signup row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base">{TYPE_EMOJI[deal.dealType] ?? "🍔"}</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
          style={{
            background: deal.tier === 1 ? "var(--color-forest)" : "var(--muted)",
            color:      deal.tier === 1 ? "var(--color-cream)"  : "var(--color-warm-gray)",
          }}
        >
          {TIER_LABEL[deal.tier] ?? "Deal"}
        </span>
        <span
          className="text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{ background: "var(--muted)", color: "var(--color-warm-gray)" }}
        >
          {SIGNUP_TYPE_LABEL[deal.signupType] ?? deal.signupType}
        </span>
      </div>

      {/* restaurant */}
      <p className="text-xs font-semibold" style={{ color: "var(--color-terracotta)" }}>
        {deal.restaurant.name}
      </p>

      {/* title */}
      <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-forest)" }}>
        {deal.title}
      </p>

      {/* description */}
      <p className="text-xs leading-relaxed" style={{ color: "var(--color-warm-gray)" }}>
        {deal.description}
      </p>

      {/* terms */}
      {deal.terms && (
        <p className="text-[10px] italic leading-relaxed opacity-60" style={{ color: "var(--color-warm-gray)" }}>
          {deal.terms}
        </p>
      )}

      {/* website link */}
      {deal.restaurant.website && (
        <a
          href={deal.restaurant.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline mt-0.5 self-start"
          style={{ color: "var(--color-forest-light)" }}
        >
          View restaurant →
        </a>
      )}
    </div>
  );
}

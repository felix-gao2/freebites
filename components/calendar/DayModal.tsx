"use client";

import { useState, useMemo, useEffect } from "react";
import { format, getMonth, getDate } from "date-fns";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DealWithOccurrences } from "@/lib/deals";

type TierFilter   = "all" | "truly_free" | "with_purchase";
type SignupFilter  = "all" | "no_prep";
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
  birthday,
}: {
  date: Date;
  deals: DealWithOccurrences[];
  onClose: () => void;
  birthday?: string;
}) {
  const [tier, setTier]         = useState<TierFilter>("all");
  const [signup, setSignup]     = useState<SignupFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isBirthday = birthday
    ? getMonth(date) + 1 === parseInt(birthday.split("-")[1], 10) &&
      getDate(date) === parseInt(birthday.split("-")[2], 10)
    : false;

  // Deals after tier + signup filters (used to compute category counts)
  const tierSignupFiltered = useMemo(() => deals.filter((d) => {
    if (tier === "truly_free"    && d.tier !== 1) return false;
    if (tier === "with_purchase" && d.tier !== 2) return false;
    if (signup === "no_prep" && d.signupType !== "no_signup" && d.signupType !== "show_id") return false;
    return true;
  }), [deals, tier, signup]);

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
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-xl flex flex-col max-h-[80vh]"
        style={{ background: "var(--card)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.8 }}
      >
        {isBirthday ? (
          /* ── Birthday header ── */
          <div
            className="relative flex flex-col items-center text-center px-5 pt-4 pb-4 border-b shrink-0"
            style={{
              background: "linear-gradient(160deg, rgba(193,97,58,0.10) 0%, rgba(237,168,100,0.08) 100%)",
              borderColor: "rgba(193,97,58,0.20)",
            }}
          >
            {/* handle */}
            <div className="w-10 h-1 rounded-full mb-3" style={{ background: "rgba(193,97,58,0.25)" }} />

            <button
              onClick={onClose}
              className="absolute top-3 right-4 text-2xl leading-none px-1 opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: "var(--color-terracotta)" }}
              aria-label="close"
            >
              ×
            </button>

            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
              className="text-4xl mb-2 select-none"
            >
              🎂
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
            >
              <h2
                className="text-xl font-black tracking-tight leading-none"
                style={{ color: "var(--color-terracotta)" }}
              >
                Your birthday!
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-warm-gray)" }}>
                {format(date, "MMMM d")}
                {deals.length > 0 && (
                  <> · <span style={{ color: "var(--color-terracotta)", fontWeight: 600 }}>
                    {deals.length} free thing{deals.length !== 1 ? "s" : ""} for you
                  </span></>
                )}
              </p>
            </motion.div>
          </div>
        ) : (
          /* ── Standard header ── */
          <>
            {/* handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

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
                      {filtersActive && filtered.length !== deals.length
                        ? `${filtered.length} of ${deals.length} deals`
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
          </>
        )}

        {/* filter row — only shown when there are deals to filter */}
        {deals.length > 0 && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 border-b overflow-x-auto shrink-0"
            style={{ borderColor: "var(--border)", scrollbarWidth: "none" }}
          >
            <Chip label="All"                active={tier === "all" && category === "all" && signup === "all"} onClick={() => { setTier("all"); setCategory("all"); setSignup("all"); }} />
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
        )}

        {/* deal list */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <span className="text-4xl">🍽️</span>
              <p className="text-sm font-medium" style={{ color: "var(--color-warm-gray)" }}>
                No free food on this day
              </p>
              <p className="text-xs opacity-60" style={{ color: "var(--color-warm-gray)" }}>
                Check another day for deals
              </p>
            </div>
          ) : (
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
                  <div key={cat} className="flex flex-col gap-1.5">
                    {category === "all" && (
                      <p
                        className="text-[11px] font-semibold uppercase tracking-wider pt-1"
                        style={{ color: "var(--color-warm-gray)" }}
                      >
                        {CATEGORY_LABELS[cat]} ({groupDeals.length})
                      </p>
                    )}
                    {groupDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
    <div
      className="shrink-0 h-4 w-px mx-0.5"
      style={{ background: "var(--border)" }}
    />
  );
}

function DealCard({ deal }: { deal: DealWithOccurrences }) {
  const hasLink = !!deal.restaurant.website;

  const content = (
    <>
      {/* badges row + optional link icon */}
      <div className="flex items-start justify-between gap-2">
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
        {hasLink && (
          <ExternalLink
            size={13}
            strokeWidth={2}
            className="shrink-0 mt-0.5 opacity-25 transition-opacity duration-150 group-hover:opacity-60"
            style={{ color: "var(--color-terracotta)" }}
          />
        )}
      </div>

      {/* restaurant */}
      <p className="text-lg font-bold leading-tight" style={{ color: "var(--color-terracotta)" }}>
        {deal.restaurant.name}
      </p>

      {/* title */}
      <p className="text-base font-medium leading-snug" style={{ color: "var(--color-forest)" }}>
        {deal.title}
      </p>

      {/* description */}
      <p
        className="text-sm leading-relaxed line-clamp-3"
        style={{ color: "var(--color-warm-gray)" }}
      >
        {deal.description}
      </p>

      {/* terms */}
      {deal.terms && (
        <p className="text-xs italic leading-relaxed opacity-60" style={{ color: "var(--color-warm-gray)" }}>
          {deal.terms}
        </p>
      )}
    </>
  );

  const base = "rounded-xl border px-3.5 py-2.5 flex flex-col gap-1 transition-all duration-150";
  const sharedStyle = { borderColor: "var(--border)", background: "var(--background)" };

  if (hasLink) {
    return (
      <a
        href={deal.restaurant.website!}
        target="_blank"
        rel="noopener noreferrer"
        className={base + " group hover:bg-[var(--color-cream)] hover:border-[var(--color-terracotta-light)]"}
        style={sharedStyle}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={base} style={sharedStyle}>
      {content}
    </div>
  );
}

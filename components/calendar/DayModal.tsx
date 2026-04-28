"use client";

import { format } from "date-fns";
import type { DealWithOccurrences } from "@/lib/deals";

const TIER_LABEL: Record<number, string> = {
  1: "Truly free",
  2: "Free with purchase",
  3: "Deal",
};

const TYPE_EMOJI: Record<string, string> = {
  birthday:     "🎂",
  national_day: "📅",
  recurring:    "🔁",
  one_off:      "⚡",
};

export default function DayModal({
  date,
  deals,
  onClose,
}: {
  date: Date;
  deals: DealWithOccurrences[];
  onClose: () => void;
}) {
  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

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
            <h2 className="text-lg font-bold" style={{ color: "var(--color-forest)" }}>
              {format(date, "MMMM d, yyyy")}
            </h2>
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

        {/* deal list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-3">
          {deals.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--color-warm-gray)" }}>
              No deals this day.
            </p>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </div>
      </div>
    </>
  );
}

function DealCard({ deal }: { deal: DealWithOccurrences }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1.5"
      style={{ borderColor: "var(--border)", background: "var(--background)" }}
    >
      {/* type + tier row */}
      <div className="flex items-center gap-2">
        <span className="text-base">{TYPE_EMOJI[deal.dealType] ?? "🍔"}</span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
          style={{
            background: deal.tier === 1 ? "var(--color-forest)" : "var(--muted)",
            color: deal.tier === 1 ? "var(--color-cream)" : "var(--color-warm-gray)",
          }}
        >
          {TIER_LABEL[deal.tier] ?? "Deal"}
        </span>
        {deal.signupRequired && (
          <span
            className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5"
            style={{ background: "var(--muted)", color: "var(--color-warm-gray)" }}
          >
            {deal.signupMethod ?? "Signup req."}
          </span>
        )}
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
        <p className="text-[11px] italic leading-relaxed" style={{ color: "var(--color-warm-gray)" }}>
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

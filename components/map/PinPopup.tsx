"use client";

import type { RestaurantPin } from "@/app/api/restaurants/route";

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

export default function PinPopup({
  pin,
  onClose,
}: {
  pin: RestaurantPin;
  onClose: () => void;
}) {
  return (
    <>
      {/* backdrop */}
      <div className="absolute inset-0 z-40" onClick={onClose} />

      {/* panel — slides up from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-xl flex flex-col max-h-[60vh]"
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
            <h2 className="text-lg font-bold" style={{ color: "var(--color-forest)" }}>
              {pin.name}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-warm-gray)" }}>
              {pin.deals.length} deal{pin.deals.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-1"
            style={{ color: "var(--color-warm-gray)" }}
          >
            ×
          </button>
        </div>

        {/* deal list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-3">
          {pin.deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border p-3 flex flex-col gap-1"
              style={{ borderColor: "var(--border)", background: "var(--background)" }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span>{TYPE_EMOJI[deal.dealType] ?? "🍔"}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                  style={{
                    background: deal.tier === 1 ? "var(--color-forest)" : "var(--muted)",
                    color: deal.tier === 1 ? "var(--color-cream)" : "var(--color-warm-gray)",
                  }}
                >
                  {TIER_LABEL[deal.tier] ?? "Deal"}
                </span>
              </div>

              <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-forest)" }}>
                {deal.title}
              </p>

              {deal.terms && (
                <p className="text-[11px] italic leading-relaxed" style={{ color: "var(--color-warm-gray)" }}>
                  {deal.terms}
                </p>
              )}
            </div>
          ))}

          {pin.website && (
            <a
              href={pin.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline self-start pb-2"
              style={{ color: "var(--color-forest-light)" }}
            >
              Visit {pin.name} →
            </a>
          )}
        </div>
      </div>
    </>
  );
}

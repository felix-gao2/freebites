"use client";

import type { RestaurantPin } from "@/app/api/restaurants/route";

const TIER_CONFIG: Record<number, { label: string; bg: string; color: string }> = {
  1: { label: "Truly free",       bg: "#2C4A3E", color: "#FFF6ED" },
  2: { label: "Free w/ purchase", bg: "#F5E8D8", color: "#7A6960" },
  3: { label: "Deal",             bg: "#F5E8D8", color: "#7A6960" },
};

const SIGNUP_LABEL: Record<string, string> = {
  no_signup:    "No signup",
  show_id:      "Show ID",
  app_required: "App required",
  email_signup: "Email signup",
  loyalty_card: "Loyalty card",
};

export default function PinPopup({
  pin,
  lat,
  lng,
  onClose,
}: {
  pin: RestaurantPin;
  lat: number;
  lng: number;
  onClose: () => void;
}) {
  const deal = pin.deals.find((d) => d.marquee) ?? pin.deals[0];
  const tier = TIER_CONFIG[deal?.tier ?? 1] ?? TIER_CONFIG[1];
  const signupLabel = SIGNUP_LABEL[deal?.signupType ?? "no_signup"] ?? "No signup";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div style={{ fontFamily: "inherit", minWidth: 220, maxWidth: 280, background: "#fff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 14px 8px" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#C1613A", lineHeight: 1.25, flex: 1, paddingRight: 8 }}>
          {pin.name}
        </h3>
        <button
          onClick={onClose}
          style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: 20, lineHeight: 1, color: "#7A6960", padding: "0 2px",
            flexShrink: 0, marginTop: -1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 14px 10px" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
          borderRadius: 20, padding: "2px 8px",
          background: tier.bg, color: tier.color,
        }}>
          {tier.label}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
          borderRadius: 20, padding: "2px 8px",
          background: "#F5E8D8", color: "#7A6960",
          border: "1px solid #E8D5C4",
        }}>
          {signupLabel}
        </span>
      </div>

      {deal && (
        <div style={{ padding: "0 14px 12px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#2C4A3E", lineHeight: 1.3 }}>
            {deal.title}
          </p>
          {deal.description && (
            <p style={{
              margin: 0, fontSize: 12, color: "#7A6960", lineHeight: 1.45,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {deal.description}
            </p>
          )}
        </div>
      )}

      {/* Extra deals count */}
      {pin.deals.length > 1 && (
        <div style={{ padding: "0 14px 10px" }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#C1613A",
            background: "#FFF0E8", borderRadius: 20, padding: "2px 8px",
            display: "inline-block",
          }}>
            +{pin.deals.length - 1} more deal{pin.deals.length - 1 !== 1 ? "s" : ""} here
          </span>
        </div>
      )}

      {/* Directions */}
      <div style={{ borderTop: "1px solid #E8D5C4", padding: "9px 14px" }}>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 600, color: "#C1613A", textDecoration: "none",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Get directions
        </a>
      </div>
    </div>
  );
}

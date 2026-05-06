import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "freebites — free food in the GTA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const EMOJIS = [
  { e: "🎂", x: 60,  y: 40,  s: 56, o: 0.13 },
  { e: "🍔", x: 220, y: 80,  s: 48, o: 0.10 },
  { e: "🍕", x: 420, y: 30,  s: 52, o: 0.11 },
  { e: "☕", x: 640, y: 60,  s: 44, o: 0.12 },
  { e: "🌮", x: 840, y: 35,  s: 50, o: 0.10 },
  { e: "🍦", x: 1020,y: 70,  s: 46, o: 0.11 },
  { e: "🥐", x: 1130,y: 30,  s: 48, o: 0.09 },
  { e: "🍩", x: 80,  y: 490, s: 50, o: 0.10 },
  { e: "🧋", x: 260, y: 520, s: 44, o: 0.11 },
  { e: "🍣", x: 460, y: 490, s: 48, o: 0.09 },
  { e: "🥯", x: 700, y: 515, s: 46, o: 0.10 },
  { e: "🍜", x: 900, y: 490, s: 52, o: 0.11 },
  { e: "🍪", x: 1080,y: 510, s: 44, o: 0.09 },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF6ED",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient gradient orbs */}
        <div style={{
          position: "absolute", top: -160, left: -160,
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(193,97,58,0.18) 0%, rgba(193,97,58,0.00) 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -140, right: -140,
          width: 560, height: 560, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(237,168,100,0.16) 0%, rgba(237,168,100,0.00) 70%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "35%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(217,132,95,0.10) 0%, rgba(217,132,95,0.00) 70%)",
        }} />

        {/* Scattered food emojis */}
        {EMOJIS.map(({ e, x, y, s, o }) => (
          <div
            key={`${e}${x}`}
            style={{
              position: "absolute",
              left: x, top: y,
              fontSize: s,
              opacity: o,
              display: "flex",
            }}
          >
            {e}
          </div>
        ))}

        {/* Centre content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          zIndex: 10,
        }}>
          {/* Dish emoji */}
          <div style={{ fontSize: 72, marginBottom: 20, display: "flex" }}>🍽️</div>

          {/* Wordmark */}
          <div style={{
            display: "flex",
            fontSize: 118,
            fontWeight: 900,
            letterSpacing: "-5px",
            lineHeight: 1,
            marginBottom: 28,
          }}>
            <span style={{ color: "#C1613A" }}>free</span>
            <span style={{ color: "#2C4A3E" }}>bites</span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 30,
            fontWeight: 400,
            color: "#7A6960",
            letterSpacing: "-0.3px",
            marginBottom: 44,
            display: "flex",
          }}>
            Your free food calendar for the GTA
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 14 }}>
            {["🎂  Birthdays", "📅  Food days", "🔁  Weekly deals"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "12px 24px",
                  borderRadius: 9999,
                  border: "1.5px solid rgba(193,97,58,0.28)",
                  background: "rgba(255,255,255,0.70)",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#7A6960",
                  letterSpacing: "-0.2px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

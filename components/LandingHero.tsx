"use client";

import { useEffect, useState } from "react";
import BirthdayForm from "./BirthdayForm";

const FLOATERS = [
  { emoji: "🍕", left: "6%",  delay: "0s",   dur: "20s" },
  { emoji: "🎂", left: "18%", delay: "5s",   dur: "24s" },
  { emoji: "🍔", left: "33%", delay: "9s",   dur: "18s" },
  { emoji: "🍣", left: "50%", delay: "2s",   dur: "22s" },
  { emoji: "🍦", left: "65%", delay: "7s",   dur: "19s" },
  { emoji: "🥗", left: "80%", delay: "13s",  dur: "21s" },
  { emoji: "🌮", left: "92%", delay: "3.5s", dur: "17s" },
  { emoji: "🍜", left: "44%", delay: "16s",  dur: "23s" },
];

export default function LandingHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(t);
  }, []);

  const enter = (delay: string) => ({
    opacity: ready ? 1 : 0,
    transform: ready ? "translateY(0px)" : "translateY(28px)",
    transition: `opacity 0.75s ease-out ${delay}, transform 0.75s ease-out ${delay}`,
  });

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-16"
      style={{ background: "var(--color-cream)" }}
    >
      {/* gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 520, height: 520,
            background: "radial-gradient(circle, rgba(193,97,58,0.22) 0%, transparent 70%)",
            filter: "blur(48px)",
            top: -130, left: -160,
            animation: "fb-orb-a 28s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 460, height: 460,
            background: "radial-gradient(circle, rgba(44,74,62,0.18) 0%, transparent 70%)",
            filter: "blur(52px)",
            bottom: -100, right: -120,
            animation: "fb-orb-b 34s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 360, height: 360,
            background: "radial-gradient(circle, rgba(217,132,95,0.18) 0%, transparent 70%)",
            filter: "blur(44px)",
            top: "35%", right: -60,
            animation: "fb-orb-c 22s ease-in-out infinite",
          }}
        />
      </div>

      {/* floating background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute bottom-[-3rem] select-none text-3xl"
            style={{
              left: f.left,
              animation: `fb-float ${f.dur} linear ${f.delay} infinite`,
            }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* main card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center">

        {/* logo + headline */}
        <div className="flex flex-col items-center gap-4" style={enter("0s")}>
          <div
            className="text-6xl leading-none"
            style={{ animation: "fb-bob 3.5s ease-in-out infinite" }}
          >
            🍽️
          </div>

          <h1 className="text-7xl font-black tracking-tighter leading-none">
            <span style={{ color: "var(--color-terracotta)" }}>free</span>
            <span style={{ color: "var(--color-forest)" }}>bites</span>
          </h1>

          <p className="text-xl leading-snug font-medium" style={{ color: "var(--color-warm-gray)" }}>
            Free food across the GTA —<br />
            birthdays, food days &amp; more.
          </p>
        </div>

        {/* form */}
        <div className="w-full" style={enter("0.2s")}>
          <BirthdayForm />
        </div>

        {/* footer */}
        <p
          className="text-sm"
          style={{
            color: "var(--color-warm-gray)",
            ...enter("0.4s"),
            opacity: ready ? 0.6 : 0,
          }}
        >
          Stored locally · no account needed
        </p>

      </div>
    </div>
  );
}

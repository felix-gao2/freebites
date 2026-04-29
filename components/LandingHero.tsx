"use client";

import { motion, useAnimation } from "framer-motion";
import { useCallback } from "react";
import BirthdayForm from "./BirthdayForm";

type FloaterDef = {
  emoji: string;
  left: string;
  size: string;
  opacity: number;
  duration: number;
  delay: number;
  xAmp: number;
  rotAmp: number;
};

// Back layer: large, slowest (50-68s), lowest opacity — parallax far plane
const BACK: FloaterDef[] = [
  { emoji: "🎂", left: "7%",  size: "3.8rem", opacity: 0.09, duration: 58, delay: 0.4, xAmp: 20, rotAmp: 8  },
  { emoji: "🍔", left: "30%", size: "4.2rem", opacity: 0.08, duration: 65, delay: 1.5, xAmp: 18, rotAmp: 10 },
  { emoji: "🌯", left: "56%", size: "3.6rem", opacity: 0.09, duration: 52, delay: 2.8, xAmp: 22, rotAmp: 9  },
  { emoji: "🍜", left: "80%", size: "4rem",   opacity: 0.08, duration: 60, delay: 4.0, xAmp: 19, rotAmp: 7  },
  { emoji: "🍕", left: "44%", size: "3.9rem", opacity: 0.07, duration: 68, delay: 5.5, xAmp: 24, rotAmp: 11 },
];

// Mid layer: medium size, medium speed (27-38s), low opacity — parallax mid plane
const MID: FloaterDef[] = [
  { emoji: "🍩", left: "14%", size: "2.6rem", opacity: 0.14, duration: 30, delay: 0.2, xAmp: 15, rotAmp: 7 },
  { emoji: "🌮", left: "38%", size: "2.8rem", opacity: 0.13, duration: 36, delay: 0.9, xAmp: 13, rotAmp: 8 },
  { emoji: "🍦", left: "63%", size: "2.4rem", opacity: 0.14, duration: 28, delay: 1.6, xAmp: 16, rotAmp: 6 },
  { emoji: "🍣", left: "87%", size: "2.7rem", opacity: 0.13, duration: 33, delay: 2.4, xAmp: 12, rotAmp: 9 },
  { emoji: "🥐", left: "50%", size: "2.5rem", opacity: 0.13, duration: 38, delay: 3.2, xAmp: 14, rotAmp: 7 },
];

// Front layer: smaller, fastest (14-22s), slightly higher opacity — parallax near plane
const FRONT: FloaterDef[] = [
  { emoji: "🍟", left: "22%", size: "1.8rem", opacity: 0.21, duration: 18, delay: 0,   xAmp: 10, rotAmp: 6 },
  { emoji: "🥯", left: "46%", size: "2rem",   opacity: 0.20, duration: 16, delay: 0.5, xAmp: 11, rotAmp: 7 },
  { emoji: "🍪", left: "70%", size: "1.7rem", opacity: 0.22, duration: 20, delay: 1.0, xAmp: 9,  rotAmp: 5 },
  { emoji: "🥨", left: "92%", size: "1.9rem", opacity: 0.19, duration: 17, delay: 1.5, xAmp: 12, rotAmp: 7 },
  { emoji: "🧋", left: "4%",  size: "1.8rem", opacity: 0.21, duration: 22, delay: 2.0, xAmp: 8,  rotAmp: 6 },
  { emoji: "☕", left: "33%", size: "1.9rem", opacity: 0.20, duration: 15, delay: 2.5, xAmp: 10, rotAmp: 6 },
];

// times[]: 0→5% quick fade-in, 5%→95% visible drift, 95%→100% fade-out
// y values are roughly linear across those times for even drift speed
const FLOAT_TIMES = [0, 0.05, 0.2, 0.72, 0.95, 1];

function Floater({ f }: { f: FloaterDef }) {
  return (
    <motion.span
      className="absolute bottom-[-3rem] select-none pointer-events-none"
      style={{ left: f.left, fontSize: f.size }}
      animate={{
        y:       ["0vh",  "-6vh",            "-28vh",       "-72vh",             "-108vh",            "-115vh"],
        x:       [0,      f.xAmp * 0.3,      f.xAmp,        -f.xAmp * 0.4,       -f.xAmp * 0.1,       0      ],
        rotate:  [0,      f.rotAmp * 0.3,    f.rotAmp,      -f.rotAmp * 0.4,     0,                   0      ],
        opacity: [0,      f.opacity,          f.opacity,     f.opacity,            f.opacity * 0.35,    0      ],
      }}
      transition={{
        duration: f.duration,
        ease: "linear",
        times: FLOAT_TIMES,
        repeat: Infinity,
        delay: f.delay,
      }}
    >
      {f.emoji}
    </motion.span>
  );
}

// Smooth deceleration curve — feels natural, not bouncy
const OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function LandingHero() {
  const burstControls = useAnimation();

  // When user picks a birthday, emoji layers briefly lurch upward then settle back (~1s total)
  const triggerBurst = useCallback(async () => {
    await burstControls.start({ y: -22, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } });
    await burstControls.start({ y: 0,   transition: { duration: 0.78, ease: [0.36, 1, 0.72, 1] } });
  }, [burstControls]);

  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-6 py-16"
      style={{ background: "var(--color-cream)" }}
    >
      {/* ambient gradient orbs — all warm tones */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 560, height: 560,
            background: "radial-gradient(circle, rgba(193,97,58,0.22) 0%, transparent 70%)",
            filter: "blur(56px)",
            top: -150, left: -180,
            animation: "fb-orb-a 28s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(237,168,100,0.20) 0%, transparent 70%)",
            filter: "blur(52px)",
            bottom: -120, right: -140,
            animation: "fb-orb-b 34s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400,
            background: "radial-gradient(circle, rgba(217,132,95,0.15) 0%, transparent 70%)",
            filter: "blur(48px)",
            bottom: "8%", left: "28%",
            animation: "fb-orb-c 22s ease-in-out infinite",
          }}
        />
      </div>

      {/* food emoji layers — single wrapper so burst moves all layers together */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        animate={burstControls}
      >
        <div className="absolute inset-0">{BACK.map((f, i)  => <Floater key={`b${i}`} f={f} />)}</div>
        <div className="absolute inset-0">{MID.map((f, i)   => <Floater key={`m${i}`} f={f} />)}</div>
        <div className="absolute inset-0">{FRONT.map((f, i) => <Floater key={`f${i}`} f={f} />)}</div>
      </motion.div>

      {/* main card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-16 text-center">

        {/* logo group — same flex layout as before, but logo+h1 and tagline animate separately */}
        <div className="flex flex-col items-center gap-6">

          {/* logo emoji + h1: scale up from 0.95, fade in */}
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: OUT }}
          >
            <div
              className="text-6xl leading-none"
              style={{ animation: "fb-bob 3.5s ease-in-out infinite" }}
            >
              🍽️
            </div>
            <h1
              className="font-black tracking-tighter leading-none"
              style={{
                fontSize: "5.2rem",
                textShadow: "0 2px 10px rgba(193,97,58,0.15)",
              }}
            >
              <span style={{ color: "var(--color-terracotta)" }}>free</span>
              <span style={{ color: "var(--color-forest)" }}>bites</span>
            </h1>
          </motion.div>

          {/* tagline: slide up slightly after logo */}
          <motion.p
            className="text-xl leading-snug font-normal"
            style={{ color: "var(--color-warm-gray)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: OUT, delay: 0.15 }}
          >
            <em style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--color-terracotta)", opacity: 0.9 }}>Free</em>{" "}
            food across the GTA — <br />
            birthdays, food days &amp; more.
          </motion.p>

        </div>

        {/* form: slides up after tagline */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: OUT, delay: 0.28 }}
        >
          <BirthdayForm onDatePick={triggerBurst} />
        </motion.div>

        {/* caption: fades in last */}
        <motion.p
          className="text-sm font-light"
          style={{ color: "var(--color-warm-gray)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.44 }}
        >
          Stored <em style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic" }}>locally</em> · no account needed
        </motion.p>

      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { motion } from "framer-motion";

export const BIRTHDAY_KEY = "freebites_birthday";

interface BirthdayFormProps {
  onDatePick?: () => void;
}

const OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function BirthdayForm({ onDatePick }: BirthdayFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [arrowHover, setArrowHover] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (saved) {
      router.replace("/calendar");
    } else {
      setLoading(false);
    }
  }, [router]);

  // Close on outside click — checks both the form container and the portal calendar
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !calendarRef.current?.contains(target)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [pickerOpen]);

  const handleToggle = useCallback(() => {
    if (pickerOpen) {
      setPickerOpen(false);
    } else if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
      setPickerOpen(true);
    }
  }, [pickerOpen]);

  const handleDaySelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setPickerOpen(false);
    onDatePick?.();
  }, [onDatePick]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (selectedDate > new Date()) return;
    localStorage.setItem(BIRTHDAY_KEY, format(selectedDate, "yyyy-MM-dd"));
    router.push("/calendar");
  };

  const today = new Date();

  if (loading) return null;

  return (
    // Form card — soft shadow lifts it off the warm background
    <div
      className="w-full rounded-3xl p-5"
      style={{
        background: "linear-gradient(160deg, #ffffff 0%, rgba(255,246,237,0.92) 100%)",
        boxShadow: "0 8px 36px rgba(193,97,58,0.13), 0 1px 6px rgba(0,0,0,0.04)",
        border: "1px solid rgba(232,213,196,0.8)",
      }}
    >
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

        {/* Date picker field */}
        <div ref={containerRef} className="flex flex-col gap-2 text-left">
          <label className="text-base font-medium" style={{ color: "var(--color-forest)" }}>
            When&apos;s your <em style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", fontWeight: "normal" }}>birthday</em>?
          </label>

          {/* Trigger button styled as an input */}
          <button
            ref={triggerRef}
            type="button"
            onClick={handleToggle}
            className="w-full rounded-2xl border px-5 py-4 text-lg font-normal text-left outline-none transition-all"
            style={{
              borderColor: pickerOpen ? "var(--color-terracotta)" : "var(--border)",
              background: "linear-gradient(180deg, #ffffff 0%, rgba(255,247,242,0.65) 100%)",
              color: selectedDate ? "var(--foreground)" : "rgba(122,105,96,0.65)",
              boxShadow: pickerOpen
                ? "0 0 0 3px rgba(193,97,58,0.14), inset 0 1px 3px rgba(0,0,0,0.04)"
                : "inset 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Enter your birthday"}
          </button>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!selectedDate}
          onHoverStart={() => setArrowHover(true)}
          onHoverEnd={() => setArrowHover(false)}
          whileHover={selectedDate ? {
            scale: 1.02,
            boxShadow: "0 8px 28px rgba(193,97,58,0.38), 0 2px 8px rgba(0,0,0,0.08)",
          } : {}}
          whileTap={selectedDate ? { scale: 0.98 } : {}}
          transition={{ duration: 0.2, ease: OUT }}
          className="w-full rounded-2xl px-5 py-4 text-lg font-bold flex items-center justify-center gap-1.5"
          style={{
            background: selectedDate ? "var(--color-terracotta)" : "rgba(193,97,58,0.38)",
            color: "var(--color-cream)",
            boxShadow: selectedDate ? "0 4px 14px rgba(193,97,58,0.28)" : "none",
            cursor: selectedDate ? "pointer" : "not-allowed",
          }}
        >
          <span>Show me the free food</span>
          <motion.span
            animate={{ x: arrowHover && selectedDate ? 4 : 0 }}
            transition={{ duration: 0.2, ease: OUT }}
          >
            →
          </motion.span>
        </motion.button>
      </form>

      {/* Calendar popover — rendered as a portal to escape overflow:hidden */}
      {mounted && pickerOpen && popoverPos && createPortal(
        <motion.div
          ref={calendarRef}
          className="rounded-2xl overflow-hidden"
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            x: "-50%",
            zIndex: 9999,
            background: "#ffffff",
            border: "1px solid var(--border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
            // CSS variable overrides scoped to this calendar instance
            "--rdp-accent-color": "#C1613A",
            "--rdp-accent-background-color": "#F5E8D8",
            "--rdp-day_button-border-radius": "10px",
            "--rdp-day-height": "38px",
            "--rdp-day-width": "38px",
            "--rdp-day_button-height": "36px",
            "--rdp-day_button-width": "36px",
          } as React.CSSProperties}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: OUT }}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            disabled={{ after: today }}
            captionLayout="dropdown"
            fromYear={1940}
            toYear={today.getFullYear()}
            classNames={{ root: "p-3" }}
          />
        </motion.div>,
        document.body
      )}
    </div>
  );
}

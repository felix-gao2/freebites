"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const BIRTHDAY_KEY = "freebites_birthday";

export default function BirthdayForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(BIRTHDAY_KEY);
    if (saved) {
      router.replace("/calendar");
    } else {
      setLoading(false);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    localStorage.setItem(BIRTHDAY_KEY, value);
    router.push("/calendar");
  }

  if (loading) return null;

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-left">
        <label
          htmlFor="birthday"
          className="text-base font-semibold"
          style={{ color: "var(--color-forest)" }}
        >
          When&apos;s your birthday?
        </label>
        <input
          id="birthday"
          type="date"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-2xl border px-5 py-4 text-lg outline-none transition-shadow focus:ring-2"
          style={{
            borderColor: "var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl px-5 py-4 text-lg font-bold transition-all active:scale-95"
        style={{
          background: "var(--color-terracotta)",
          color: "var(--color-cream)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--color-terracotta-dark)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "var(--color-terracotta)")
        }
      >
        Show me the free food →
      </button>
    </form>
  );
}

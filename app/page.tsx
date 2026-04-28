import BirthdayForm from "@/components/BirthdayForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

        {/* brand */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🍕</span>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--color-terracotta)" }}>
            freebites
          </h1>
          <p className="text-base" style={{ color: "var(--color-warm-gray)" }}>
            Free food in the GTA — birthdays, national food days, and more.
          </p>
        </div>

        {/* form */}
        <BirthdayForm />

        {/* footer note */}
        <p className="text-xs" style={{ color: "var(--color-warm-gray)" }}>
          Birthday stored locally on your device. No account required.
        </p>

      </div>
    </main>
  );
}

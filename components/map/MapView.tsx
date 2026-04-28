import type { MapFilter } from "@/app/map/page";

export default function MapView({ birthday, filter }: { birthday: string; filter: MapFilter }) {
  void birthday; void filter;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--muted)", color: "var(--color-warm-gray)" }}>
      Map loading…
    </div>
  );
}

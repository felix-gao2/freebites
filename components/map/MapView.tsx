"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapFilter } from "@/app/map/page";
import type { RestaurantPin } from "@/app/api/restaurants/route";
import PinPopup from "./PinPopup";

// GTA fallback center
const GTA_CENTER: [number, number] = [-79.3832, 43.6532];
const GTA_ZOOM = 10;

export default function MapView({
  birthday,
  filter,
}: {
  birthday: string;
  filter: MapFilter;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [pins, setPins] = useState<RestaurantPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<RestaurantPin | null>(null);
  const [geoError, setGeoError] = useState(false);

  // Fetch restaurant pins once
  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then(setPins)
      .catch(console.error);
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("NEXT_PUBLIC_MAPBOX_TOKEN not set");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: GTA_CENTER,
      zoom: GTA_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Try geolocation, fall back to GTA
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          // Only fly to user if they're within GTA bounding box
          if (lat > 43.4 && lat < 44.1 && lng > -80.0 && lng < -78.8) {
            map.flyTo({ center: [lng, lat], zoom: 12 });
          }
        },
        () => setGeoError(true),
        { timeout: 5000 },
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add / refresh markers when pins or filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const today = new Date();
    const todayKey = fmtKey(today);
    const weekKeys = new Set(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return fmtKey(d);
      }),
    );
    const [bMonth, bDay] = parseBirthday(birthday);

    const filtered = pins.filter((pin) => {
      if (filter === "all") return true;
      return pin.deals.some((deal) => {
        if (filter === "birthday") return deal.dealType === "birthday";
        if (filter === "today") return isDealOnDate(deal, todayKey, bMonth, bDay);
        if (filter === "week") {
          for (const k of weekKeys) {
            if (isDealOnDate(deal, k, bMonth, bDay)) return true;
          }
          return false;
        }
        return true;
      });
    });

    const addMarkers = () => {
      filtered.forEach((pin) => {
        const el = document.createElement("div");
        el.className = "mapbox-pin";
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: #C1613A; border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        `;
        el.textContent = "🍴";
        el.addEventListener("click", () => setSelectedPin(pin));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }
  }, [pins, filter, birthday]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {geoError && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full shadow"
          style={{ background: "var(--card)", color: "var(--color-warm-gray)" }}
        >
          Location unavailable — showing GTA
        </div>
      )}

      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--muted)" }}>
          <p className="text-sm" style={{ color: "var(--color-warm-gray)" }}>
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env to enable map
          </p>
        </div>
      )}

      {selectedPin && (
        <PinPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
      )}
    </div>
  );
}

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseBirthday(raw: string): [number, number] {
  const p = raw.split("-");
  return [parseInt(p[1], 10), parseInt(p[2], 10)];
}

function isDealOnDate(
  deal: RestaurantPin["deals"][number],
  _dateKey: string,
  _bMonth: number,
  _bDay: number,
): boolean {
  // For filter purposes: birthday deals → match birthday filter
  // national_day / recurring → always show in today/week (simplified for MVP)
  if (deal.dealType === "birthday") return false; // handled by "birthday" filter
  return true;
}

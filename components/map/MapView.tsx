"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapFilter } from "@/app/map/page";
import type { RestaurantPin } from "@/app/api/restaurants/route";
import PinPopup from "./PinPopup";

const GTA_CENTER: [number, number] = [-79.4, 43.7];
const GTA_ZOOM = 9;

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

  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then(setPins)
      .catch(console.error);
  }, []);

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const { tier, signup, category } = filter;
    const isAll = tier === "all" && signup === "all" && category === "all";

    const filtered = isAll
      ? pins
      : pins.filter((pin) => {
          if (category !== "all" && pin.category !== category) return false;
          return pin.deals.some((deal) => {
            if (tier === "truly_free"    && deal.tier !== 1) return false;
            if (tier === "with_purchase" && deal.tier !== 2) return false;
            if (signup === "no_prep" && deal.signupType !== "no_signup" && deal.signupType !== "show_id") return false;
            return true;
          });
        });

    const addMarkers = () => {
      filtered.forEach((pin) => {
        const el = document.createElement("div");
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

      // Fit bounds to visible pins; fall back to GTA default when all filters cleared
      if (filtered.length === 0 || isAll) {
        map.flyTo({ center: GTA_CENTER, zoom: GTA_ZOOM });
      } else if (filtered.length === 1) {
        map.flyTo({ center: [filtered[0].lng, filtered[0].lat], zoom: 13 });
      } else {
        const bounds = filtered.reduce(
          (b, pin) => b.extend([pin.lng, pin.lat]),
          new mapboxgl.LngLatBounds([filtered[0].lng, filtered[0].lat], [filtered[0].lng, filtered[0].lat]),
        );
        map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
      }
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

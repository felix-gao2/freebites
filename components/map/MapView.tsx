"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapFilter } from "@/app/map/page";
import type { RestaurantPin } from "@/app/api/restaurants/route";
import PinPopup from "./PinPopup";

const GTA_CENTER: [number, number] = [-79.4, 43.7];
const GTA_ZOOM = 9;
const TIER1_COLOR = "#C1613A";
const TIER2_COLOR = "#D4916B";

// Lucide-derived SVG path strings (24×24 viewBox)
const ICON_PATHS: Record<string, string> = {
  coffee_drinks:
    '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/>' +
    '<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/>' +
    '<line x1="6" y1="2" x2="6" y2="4"/>' +
    '<line x1="10" y1="2" x2="10" y2="4"/>' +
    '<line x1="14" y1="2" x2="14" y2="4"/>',
  bakeries_sweets:
    '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>' +
    '<path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/>' +
    '<path d="M2 21h20"/>' +
    '<path d="M7 8v2M12 8v2M17 8v2"/>',
  fast_food:
    '<path d="M3 11v3h18v-3"/>' +
    '<path d="M4 17h16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>' +
    '<path d="M5 11a7 7 0 0 1 14 0"/>',
  sit_down:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>' +
    '<line x1="7" y1="2" x2="7" y2="22"/>' +
    '<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v5"/>',
  ice_cream:
    '<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/>' +
    '<path d="M17 7A5 5 0 0 0 7 7"/>' +
    '<circle cx="12" cy="7" r="3"/>',
  convenience:
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>' +
    '<line x1="3" y1="6" x2="21" y2="6"/>' +
    '<path d="M16 10a4 4 0 0 1-8 0"/>',
};

const CATEGORIES = [
  "coffee_drinks", "bakeries_sweets", "fast_food",
  "sit_down", "ice_cream", "convenience",
] as const;

function buildPinSvgUrl(category: string, tier: number): string {
  const color = tier === 1 ? TIER1_COLOR : TIER2_COLOR;
  const paths = ICON_PATHS[category] ?? ICON_PATHS.sit_down;
  // 24×24 icon scaled to fit a 32×32 circle: translate(4,4) then scale(0.667)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">` +
    `<circle cx="16" cy="16" r="15" fill="${color}" stroke="white" stroke-width="2"/>` +
    `<g transform="translate(4,4)" fill="none" stroke="white" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">` +
    paths +
    `</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function ensurePinImages(map: mapboxgl.Map): Promise<void> {
  await Promise.all(
    CATEGORIES.flatMap((cat) =>
      [1, 2].map(
        (tier) =>
          new Promise<void>((resolve, reject) => {
            const name = `pin-${cat}-${tier}`;
            if (map.hasImage(name)) { resolve(); return; }
            const img = new Image(32, 32);
            img.onload = () => { if (!map.hasImage(name)) map.addImage(name, img); resolve(); };
            img.onerror = reject;
            img.src = buildPinSvgUrl(cat, tier);
          }),
      ),
    ),
  );
}

function toGeoJSON(pins: RestaurantPin[]) {
  return {
    type: "FeatureCollection" as const,
    features: pins.flatMap((pin) => {
      const minTier = pin.deals.reduce((m, d) => Math.min(m, d.tier), Infinity);
      return pin.locations.map((loc) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [loc.lng, loc.lat] },
        properties: {
          restaurantId: pin.id,
          locationId: loc.id,
          category: pin.category,
          minTier: isFinite(minTier) ? minTier : 1,
        },
      }));
    }),
  };
}

function fitToPins(map: mapboxgl.Map, pins: RestaurantPin[], isAll: boolean) {
  const pts = pins.flatMap((p) => p.locations.map((l) => [l.lng, l.lat] as [number, number]));
  if (pts.length === 0 || isAll) {
    map.flyTo({ center: GTA_CENTER, zoom: GTA_ZOOM });
  } else if (pts.length === 1) {
    map.flyTo({ center: pts[0], zoom: 13 });
  } else {
    const bounds = pts.reduce((b, pt) => b.extend(pt), new mapboxgl.LngLatBounds(pts[0], pts[0]));
    map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
  }
}

function applyFilters(pins: RestaurantPin[], filter: MapFilter) {
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
  return { filtered, isAll };
}

export default function MapView({
  birthday,
  filter,
}: {
  birthday: string;
  filter: MapFilter;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const pinsRef      = useRef<RestaurantPin[]>([]);
  // Store computed data so the load handler can apply it if pins arrived first
  const pendingRef   = useRef<{
    geojson:  ReturnType<typeof toGeoJSON>;
    filtered: RestaurantPin[];
    isAll:    boolean;
  } | null>(null);
  const readyRef     = useRef(false);

  const [pins, setPins] = useState<RestaurantPin[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<{
    pin: RestaurantPin;
    lat: number;
    lng: number;
  } | null>(null);
  const popupRef     = useRef<mapboxgl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);

  pinsRef.current = pins;

  // Fetch pins once
  useEffect(() => {
    fetch("/api/restaurants").then((r) => r.json()).then(setPins).catch(console.error);
  }, []);

  // Init map + source + layers (runs once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) { console.warn("NEXT_PUBLIC_MAPBOX_TOKEN not set"); return; }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: GTA_CENTER,
      zoom: GTA_ZOOM,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", async () => {
      await ensurePinImages(map);

      // Use any data that arrived before the style loaded
      const initialData = pendingRef.current?.geojson ?? { type: "FeatureCollection" as const, features: [] };

      map.addSource("restaurants", {
        type: "geojson",
        data: initialData,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "restaurants",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": TIER1_COLOR,
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 30],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count label
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "restaurants",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 13,
        },
        paint: { "text-color": "#ffffff" },
      });

      // Individual pins — icon chosen by category + minTier
      map.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: "restaurants",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": [
            "concat",
            "pin-",
            ["get", "category"],
            "-",
            ["to-string", ["get", "minTier"]],
          ],
          "icon-size": 1,
          "icon-allow-overlap": true,
        },
      });

      readyRef.current = true;

      // Apply fit if data was pre-computed
      if (pendingRef.current) {
        fitToPins(map, pendingRef.current.filtered, pendingRef.current.isAll);
      }

      // Cluster click → zoom in until it breaks apart
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id as number;
        (map.getSource("restaurants") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || zoom == null) return;
            const coords = (features[0].geometry as unknown as { coordinates: [number, number] }).coordinates;
            map.easeTo({ center: coords, zoom });
          },
        );
      });

      // Pin click → popup
      map.on("click", "unclustered-point", (e) => {
        const props = e.features?.[0]?.properties;
        const geom  = e.features?.[0]?.geometry;
        if (!props || !geom || geom.type !== "Point") return;
        const [lng, lat] = (geom as { type: "Point"; coordinates: [number, number] }).coordinates;
        const pin = pinsRef.current.find((p) => p.id === props.restaurantId);
        if (pin) setSelectedFeature({ pin, lat, lng });
      });

      // Background click → close popup
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point", "clusters"] });
        if (!hits.length) setSelectedFeature(null);
      });

      map.on("mouseenter", "clusters",          () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters",          () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });
    });

    return () => {
      readyRef.current = false;
      popupRootRef.current?.unmount();
      popupRootRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-compute GeoJSON and update source whenever pins or filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;

    const { filtered, isAll } = applyFilters(pins, filter);
    const geojson = toGeoJSON(filtered);
    pendingRef.current = { geojson, filtered, isAll };

    if (readyRef.current) {
      (map.getSource("restaurants") as mapboxgl.GeoJSONSource).setData(geojson);
      fitToPins(map, filtered, isAll);
    }
  }, [pins, filter, birthday]);

  // Create / destroy the anchored Mapbox popup whenever selectedFeature changes
  useEffect(() => {
    popupRootRef.current?.unmount();
    popupRootRef.current = null;
    popupRef.current?.remove();
    popupRef.current = null;

    const map = mapRef.current;
    if (!selectedFeature || !map) return;

    const container = document.createElement("div");
    const root = createRoot(container);
    popupRootRef.current = root;
    root.render(
      <PinPopup
        pin={selectedFeature.pin}
        lat={selectedFeature.lat}
        lng={selectedFeature.lng}
        onClose={() => setSelectedFeature(null)}
      />
    );

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "freebites-popup",
      maxWidth: "300px",
      offset: 18,
    })
      .setLngLat([selectedFeature.lng, selectedFeature.lat])
      .setDOMContent(container)
      .addTo(map);

    popupRef.current = popup;
  }, [selectedFeature]);

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
    </div>
  );
}

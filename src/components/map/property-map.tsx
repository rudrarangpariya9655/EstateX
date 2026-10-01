"use client";

import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";
import { cityName } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { sizedImageUrl } from "@/lib/images";
import { cn } from "@/lib/cn";

export interface MapPoint {
  id: string;
  slug: string;
  name: string;
  locality: string;
  city: string;
  price: number;
  latitude: number;
  longitude: number;
  coverUrl: string | null;
}

type Status = "loading" | "ready" | "failed" | "tiles-failed";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function tileConfig() {
  if (MAPBOX_TOKEN) {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      attribution:
        '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abc",
    };
  }
  // OpenStreetMap standard tiles (no key; light use with attribution per the OSMF tile policy).
  // They are toned to the EstateX palette with a CSS filter on the tile pane.
  return {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: "",
  };
}

/** Popup content built with DOM APIs (textContent), never string-concatenated HTML. */
function popupContent(point: MapPoint): HTMLElement {
  const link = document.createElement("a");
  link.href = `/properties/${point.slug}`;
  link.className = "block text-ink no-underline";
  if (point.coverUrl) {
    const img = document.createElement("img");
    img.src = sizedImageUrl(point.coverUrl, 496, 300);
    img.alt = "";
    img.loading = "lazy";
    img.className = "block aspect-[248/150] w-full object-cover bg-[#e6e0d4]";
    link.appendChild(img);
  }
  const body = document.createElement("div");
  body.className = "px-4 pb-4 pt-3";
  const name = document.createElement("p");
  name.className = "font-serif text-[1.35rem] leading-tight";
  name.textContent = point.name;
  const meta = document.createElement("p");
  meta.className = "mt-1 text-[0.8125rem] text-[#6f6d68]";
  meta.textContent = `${point.locality}, ${cityName(point.city)}`;
  const footer = document.createElement("p");
  footer.className = "mt-3 flex items-center justify-between text-[0.875rem]";
  const price = document.createElement("span");
  price.className = "font-medium";
  price.textContent = formatPrice(point.price);
  const view = document.createElement("span");
  view.className = "text-[0.68rem] font-medium uppercase tracking-[0.14em]";
  view.textContent = "View property →";
  footer.append(price, view);
  body.append(name, meta, footer);
  link.appendChild(body);
  return link;
}

export function PropertyMap({
  points,
  selectedId,
  onSelect,
  variant = "search",
  label,
  className,
}: {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  variant?: "search" | "single";
  label: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !containerRef.current) return;
        const map = L.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: variant === "search",
          attributionControl: true,
        });
        mapRef.current = map;

        const tiles = tileConfig();
        let loaded = 0;
        let errors = 0;
        L.tileLayer(tiles.url, {
          attribution: tiles.attribution,
          subdomains: tiles.subdomains,
          maxZoom: 19,
          className: MAPBOX_TOKEN ? undefined : "ex-osm-tiles",
        })
          .on("tileload", () => {
            loaded++;
          })
          .on("tileerror", () => {
            errors++;
            if (errors >= 6 && loaded === 0) setStatus("tiles-failed");
          })
          .addTo(map);

        map.setView([20.6, 78.9], 5);
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
        setStatus("ready");
      } catch (error) {
        console.error("[map] failed to initialise", error);
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [variant]);

  // Sync markers with the current points.
  useEffect(() => {
    if (status !== "ready" && status !== "tiles-failed") return;
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      for (const point of points) {
        const icon =
          variant === "single"
            ? L.divIcon({ className: "ex-marker", html: '<span class="ex-marker-dot block"></span>', iconSize: [0, 0] })
            : L.divIcon({
                className: "ex-marker",
                html: `<span class="ex-marker-pill" data-active="false"></span>`,
                iconSize: [0, 0],
              });
        const marker = L.marker([point.latitude, point.longitude], {
          icon,
          title: `${point.name}, ${formatPrice(point.price)}`,
          keyboard: variant === "search",
          riseOnHover: true,
        }).addTo(map);

        if (variant === "search") {
          const pill = marker.getElement()?.querySelector(".ex-marker-pill");
          if (pill) pill.textContent = formatPrice(point.price);
          marker.bindPopup(() => popupContent(point), { closeButton: true, offset: [0, -30], maxWidth: 260, minWidth: 248 });
          marker.on("click", () => onSelectRef.current?.(point.id));
        }
        markersRef.current.set(point.id, marker);
      }

      if (points.length === 1) {
        map.setView([points[0]!.latitude, points[0]!.longitude], variant === "single" ? 13 : 12);
      } else if (points.length > 1) {
        const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [points, status, variant]);

  // Highlight the selected property.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || variant !== "search") return;
    markersRef.current.forEach((marker, id) => {
      const active = id === selectedId;
      marker.getElement()?.querySelector(".ex-marker-pill")?.setAttribute("data-active", String(active));
      marker.setZIndexOffset(active ? 1000 : 0);
    });
    if (selectedId) {
      const marker = markersRef.current.get(selectedId);
      if (marker) {
        map.panTo(marker.getLatLng(), { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
        if (!marker.isPopupOpen()) marker.openPopup();
      }
    }
  }, [selectedId, variant, points, status]);

  if (status === "failed") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 bg-sand p-8 text-center", className)}>
        <MapPinOff aria-hidden className="size-6 text-muted" strokeWidth={1.25} />
        <p className="font-serif text-[1.5rem]">Map unavailable</p>
        <p className="max-w-xs text-[0.875rem] text-muted">
          The map couldn&apos;t be loaded right now. Every residence is still listed alongside.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative isolate overflow-hidden bg-sand", className)}>
      <div ref={containerRef} role="region" aria-label={label} className="absolute inset-0" />
      {status === "loading" ? <div aria-hidden className="skeleton absolute inset-0" /> : null}
      {status === "tiles-failed" ? (
        <p role="status" className="absolute inset-x-4 top-4 z-[500] bg-surface px-4 py-3 text-[0.8125rem] text-muted shadow">
          Map tiles couldn&apos;t load (you may be offline). Markers are shown on a blank map.
        </p>
      ) : null}
    </div>
  );
}

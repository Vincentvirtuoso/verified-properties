"use client";

import { memo, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

const LAGOS: [number, number] = [6.5244, 3.3792];
const MIN_PIN_ZOOM = 16;

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const STREET_TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

const SATELLITE_TILES = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri",
};

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  regionLat: number | null;
  regionLng: number | null;
  onPick: (lat: number, lng: number) => void;
}

function ClickToCenter() {
  useMapEvents({
    click(e) {
      e.target.panTo(e.latlng);
    },
  });
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  useMapEvents({
    zoomend(e) {
      onZoom(e.target.getZoom());
    },
  });
  return null;
}

export const LocationPicker = memo(function LocationPicker({
  lat,
  lng,
  onPick,
  regionLat,
  regionLng,
}: LocationPickerProps) {
  const hasSavedPin = lat != null && lng != null;
  const mapRef = useRef<LeafletMap | null>(null);

  const regionKey =
    regionLat != null && regionLng != null ? `${regionLat},${regionLng}` : null;
  const lastRegion = useRef<string | null>(regionKey);

  useEffect(() => {
    if (!regionKey || regionKey === lastRegion.current) return;
    lastRegion.current = regionKey;
    if (regionLat == null || regionLng == null) return;
    mapRef.current?.flyTo([regionLat, regionLng], 13, { duration: 0.8 });
  }, [regionKey, regionLat, regionLng]);

  const [start] = useState(() => {
    if (lat != null && lng != null)
      return { center: [lat, lng] as [number, number], zoom: 17 };
    if (regionLat != null && regionLng != null)
      return { center: [regionLat, regionLng] as [number, number], zoom: 13 };
    return { center: LAGOS, zoom: 12 };
  });

  const [zoom, setZoom] = useState(start.zoom);
  const [satellite, setSatellite] = useState(false);
  const tiles = satellite ? SATELLITE_TILES : STREET_TILES;
  const canDrop = zoom >= MIN_PIN_ZOOM;

  const dropPin = () => {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    onPick(Number(center.lat.toFixed(6)), Number(center.lng.toFixed(6)));
  };

  return (
    <div className="relative z-1">
      <MapContainer
        ref={mapRef}
        center={start.center}
        zoom={start.zoom}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
      >
        <TileLayer
          key={satellite ? "sat" : "street"}
          url={tiles.url}
          attribution={tiles.attribution}
          detectRetina
        />
        <ClickToCenter />
        <ZoomWatcher onZoom={setZoom} />
        {hasSavedPin && (
          <Marker position={[lat, lng]} icon={pinIcon} interactive={false} />
        )}
      </MapContainer>

      <button
        type="button"
        onClick={() => setSatellite((s) => !s)}
        className="absolute right-3 top-3 z-50 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow"
      >
        {satellite ? "Street view" : "Satellite"}
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-card p-3">
        <p className="text-xs text-muted">
          {canDrop
            ? "Move the map so the crosshair sits on the building entrance."
            : "Zoom in closer to place the pin accurately."}
        </p>
        <button
          type="button"
          onClick={dropPin}
          disabled={!canDrop}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {hasSavedPin ? "Update pin here" : "Drop pin here"}
        </button>
      </div>
    </div>
  );
});

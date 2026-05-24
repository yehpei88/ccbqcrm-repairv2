/**
 * MAP COMPONENT - Leaflet Implementation
 * 
 * 當前使用 Leaflet 作為地圖基礎
 * 預留 Google Maps API 串接位置，可在以下位置無縫切換：
 * 1. 標記點渲染 (Marker rendering)
 * 2. 地理編碼 (Geocoding)
 * 3. 路線規劃 (Directions/Routing)
 * 
 * USAGE FROM PARENT COMPONENT:
 * ======
 * 
 * const mapRef = useRef<L.Map | null>(null);
 * 
 * <MapView
 *   initialCenter={{ lat: 25.0330, lng: 121.5438 }}
 *   initialZoom={13}
 *   onMapReady={(map) => {
 *     mapRef.current = map;
 *   }}
 * />
 * 
 * ======
 * 
 * 未來 Google Maps 整合點：
 * - 使用 google.maps.Marker 替代 L.marker
 * - 使用 google.maps.Geocoder 進行地址查詢
 * - 使用 google.maps.DirectionsService 規劃路線
 */

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// 修復 Leaflet 默認圖標問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}

/**
 * 內部元件：用於在 MapContainer 內部訪問地圖實例
 */
function MapInitializer({
  onMapReady,
}: {
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

/**
 * 標記點元件
 * 預留 Google Maps 整合點：
 * 可在此處替換為 google.maps.marker.AdvancedMarkerElement
 */
function MapMarkers({
  markers,
}: {
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
  }>;
}) {
  if (!markers || markers.length === 0) {
    return null;
  }

  return (
    <>
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold">{marker.title}</h3>
              {marker.description && (
                <p className="text-gray-600 mt-1">{marker.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export function MapView({
  className,
  initialCenter = { lat: 25.0330, lng: 121.5438 }, // 台灣中心
  initialZoom = 13,
  onMapReady,
  markers,
}: MapViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleMapReady = usePersistFn((map: L.Map) => {
    mapRef.current = map;
    setIsLoading(false);
    if (onMapReady) {
      onMapReady(map);
    }
  });

  return (
    <div className={cn("relative w-full h-full bg-gray-100", className)}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="text-center p-4">
            <p className="text-sm text-red-600">Error loading map:</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={initialZoom}
        style={{ width: "100%", height: "100%" }}
        className="z-0"
      >
        {/* 
          地圖圖層來源
          預留 Google Maps 整合點：
          可在此替換為 google.maps.TileLayer 或其他圖層
        */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 
          標記點渲染
          預留 Google Maps 整合點：
          可在此替換為 google.maps.marker.AdvancedMarkerElement
        */}
        <MapMarkers markers={markers} />

        {/* 地圖初始化回調 */}
        <MapInitializer onMapReady={handleMapReady} />
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 工具函數：用於未來 Google Maps 整合
 * 
 * 地理編碼（地址 → 坐標）
 * TODO: 當 Google Maps API 可用時，使用 google.maps.Geocoder
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  // 當前使用 OpenStreetMap Nominatim API
  // 未來可替換為 google.maps.Geocoder
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * 工具函數：計算兩點之間的距離
 * TODO: 當 Google Maps API 可用時，使用 google.maps.geometry.spherical
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Haversine 公式
  const R = 6371; // 地球半徑（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

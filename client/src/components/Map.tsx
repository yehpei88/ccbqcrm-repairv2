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

/**
 * PIN 狀態配置
 */
const PIN_STATUS_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  'red-star': { color: '#ef4444', emoji: '⭐', label: '紅星' },
  'red': { color: '#f87171', emoji: '🔴', label: '紅標' },
  'green': { color: '#22c55e', emoji: '🟢', label: '綠標' },
  'purple': { color: '#a855f7', emoji: '🟣', label: '紫標' },
  'gold': { color: '#eab308', emoji: '🟡', label: '金標' },
};

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
    pinStatus?: 'red-star' | 'red' | 'green' | 'purple' | 'gold';
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
 * 標記點元件 - 支援 PIN 狀態顯示
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
    pinStatus?: 'red-star' | 'red' | 'green' | 'purple' | 'gold';
  }>;
}) {
  if (!markers || markers.length === 0) {
    return null;
  }

  return (
    <>
      {markers.map((marker) => {
        const statusConfig = marker.pinStatus ? PIN_STATUS_CONFIG[marker.pinStatus] : PIN_STATUS_CONFIG['red'];
        
        return (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={L.divIcon({
              html: `
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 44px;
                  height: 44px;
                  background-color: ${statusConfig.color};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  font-size: 22px;
                  font-weight: bold;
                  cursor: pointer;
                  transition: transform 0.2s;
                ">
                  ${statusConfig.emoji}
                </div>
              `,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
              popupAnchor: [0, -22],
            })}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold">{marker.title}</h3>
                {marker.pinStatus && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>狀態：</strong>{statusConfig.label}
                  </p>
                )}
                {marker.description && (
                  <p className="text-gray-600 mt-1 text-xs">{marker.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
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
  const mapRef = useRef<L.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMapReady = usePersistFn((map: L.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  });

  return (
    <div className={cn("relative w-full h-full bg-gray-100", className)}>
      {error && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg p-4 z-50 max-w-xs">
          <p className="text-sm text-red-600">Error loading map:</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      )}

      <MapContainer
        center={[initialCenter.lat, initialCenter.lng] as L.LatLngExpression}
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
          標記點渲染 - 支援 PIN 狀態顯示
          預留 Google Maps 整合點：
          可在此替換為 google.maps.marker.AdvancedMarkerElement
        */}
        <MapMarkers markers={markers} />

        {/* 地圖初始化回調 */}
        <MapInitializer onMapReady={handleMapReady} />
      </MapContainer>
    </div>
  );
}

/**
 * 地理編碼函數 - 使用 OpenStreetMap Nominatim API
 * 預留 Google Maps 整合點：
 * 可在此替換為 google.maps.Geocoder
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
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

/**
 * GOOGLE MAPS COMPONENT
 * 
 * 實現功能：
 * 1. 多個 Marker（標記）- 根據民宿資料陣列動態生成
 * 2. LatLngBounds（自動縮放視窗）- 自動調整地圖範圍包住所有民宿
 * 3. InfoWindow（資訊視窗）- 點擊 PIN 顯示民宿名稱和狀態
 */

import { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { cn } from "@/lib/utils";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  pinStatus?: 'red-star' | 'red' | 'green' | 'purple' | 'gold';
}

interface GoogleMapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  markers?: MapMarker[];
  apiKey?: string;
}

// PIN 狀態配置 - 顏色對應
const PIN_STATUS_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  'red-star': { color: '#dc2626', emoji: '⭐', label: '紅星 - 高潛力未開發' },
  'red': { color: '#ef4444', emoji: '🔴', label: '紅標 - 一般未開發' },
  'green': { color: '#16a34a', emoji: '🟢', label: '綠標 - 已開發/已加 LINE' },
  'purple': { color: '#9333ea', emoji: '🟣', label: '紫標 - 合作中 (1-3 次)' },
  'gold': { color: '#ca8a04', emoji: '🟡', label: '金標 - VIP 客戶 (≥ 3 次)' },
};

export function GoogleMapView({
  className,
  initialCenter = { lat: 24.7021, lng: 121.7377 }, // 宜蘭中心
  initialZoom = 11,
  onMapReady,
  markers = [],
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
}: GoogleMapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // 地圖容器樣式
  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  // 處理地圖載入完成
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    if (onMapReady) {
      onMapReady(map);
    }
  };

  // 建立自訂 Marker 圖標
  const createMarkerIcon = (status?: string) => {
    const config = status ? PIN_STATUS_CONFIG[status] : PIN_STATUS_CONFIG['red'];
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 16,
      fillColor: config.color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };
  };

  // 處理 Marker 點擊
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    
    // 關閉之前的 InfoWindow
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // 建立新的 InfoWindow
    const content = `
      <div style="padding: 12px; font-family: Arial, sans-serif; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
          ${marker.title}
        </h3>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">
          <strong>地區：</strong>${marker.description || '未知'}
        </p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          <strong>狀態：</strong>${PIN_STATUS_CONFIG[marker.pinStatus || 'red'].label}
        </p>
      </div>
    `;

    infoWindowRef.current = new google.maps.InfoWindow({
      content: content,
      position: { lat: marker.lat, lng: marker.lng },
    });

    infoWindowRef.current.open(mapRef.current);

    // 地圖中心移動到該 Marker
    if (mapRef.current) {
      mapRef.current.panTo({ lat: marker.lat, lng: marker.lng });
    }
  };

  // 建立 Markers 並自動調整地圖範圍
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;

    // 清除舊的 Markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // 建立 LatLngBounds
    const bounds = new google.maps.LatLngBounds();

    // 建立新的 Markers
    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: mapRef.current,
        title: markerData.title,
        icon: createMarkerIcon(markerData.pinStatus),
      });

      // 新增點擊事件監聽
      marker.addListener('click', () => {
        handleMarkerClick(markerData);
      });

      markersRef.current.set(markerData.id, marker);

      // 擴展 bounds
      bounds.extend({ lat: markerData.lat, lng: markerData.lng });
    });

    // 自動調整地圖範圍以包含所有 Markers
    if (mapRef.current && markers.length > 0) {
      mapRef.current.fitBounds(bounds);
      
      // 如果只有一個 Marker，設定適當的縮放級別
      if (markers.length === 1) {
        mapRef.current.setZoom(15);
      }
    }
  }, [markers]);

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={handleMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* 手動渲染 Markers（因為我們需要自訂圖標和事件） */}
        {/* 使用 useEffect 中的 google.maps.Marker API 實現 */}
      </GoogleMap>
    </LoadScript>
  );
}

export default GoogleMapView;

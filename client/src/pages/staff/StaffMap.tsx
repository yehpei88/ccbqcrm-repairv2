// CC 代客烤肉 CRM 系統 — 顧客開發人員地圖作業頁面
// 設計：地圖 Pin 操作，過濾器，AI 推薦優先撥打

import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, type PinStatus, type Minsu } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Phone, MapPin, Star, Filter, ChevronRight,
  ArrowUpDown, Info, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapView, geocodeAddress } from '@/components/Map';

const PIN_COLORS: Record<PinStatus, string> = {
  'red-star': '#ef4444',
  'red': '#f87171',
  'green': '#22c55e',
  'purple': '#a855f7',
  'gold': '#eab308',
};

export default function StaffMap() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker | L.Marker>>(new Map());
  const markerLocationsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // 顧客開發人員只看未開發的（紅星、紅標）和已加LINE的（綠標）
  const filtered = MOCK_MINSU_DATA
    .filter(m => {
      if (filterStatus === 'all') return true;
      return m.pinStatus === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.aiScore - a.aiScore;
      if (sortBy === 'area') return a.area.localeCompare(b.area);
      return 0;
    });

  useEffect(() => {
    const loadMarkers = async () => {
      if (!mapRef.current) return;

      for (const minsu of filtered) {
        const location = await geocodeAddress(minsu.address);
        if (location) {
          markerLocationsRef.current.set(minsu.id, location);

          // 建立 Leaflet marker
          const marker = L.circleMarker([location.lat, location.lng], {
            radius: minsu.pinStatus === 'red-star' ? 10 : 7,
            fillColor: PIN_COLORS[minsu.pinStatus],
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          })
            .bindPopup(
              `<div style="font-family:'Noto Sans TC',sans-serif;padding:4px;min-width:180px">
                <div style="font-weight:700;font-size:14px;margin-bottom:4px">${minsu.name}</div>
                <div style="font-size:12px;color:#666;margin-bottom:2px">${PIN_STATUS_CONFIG[minsu.pinStatus].label}</div>
                <div style="font-size:12px;color:#666">AI 評分：${minsu.aiScore}/50</div>
                <div style="font-size:12px;color:#1e3a5f;font-weight:600;margin-top:4px">${minsu.phone}</div>
              </div>`
            )
            .addTo(mapRef.current);

          marker.on('click', () => {
            setSelectedMinsu(minsu);
          });

          markersRef.current.set(minsu.id, marker as L.CircleMarker);
        }
      }
    };

    loadMarkers();
  }, [filtered]);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  // 點擊民宿清單時縮放地圖並定位
  const handleSelectMinsu = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    
    // 如果 marker 已經載入，則縮放地圖並定位
    if (mapRef.current && markerLocationsRef.current.has(minsu.id)) {
      const location = markerLocationsRef.current.get(minsu.id)!;
      mapRef.current.setView([location.lat, location.lng], 16);
      // 開啟 popup
      const marker = markersRef.current.get(minsu.id);
      if (marker && 'openPopup' in marker) {
        (marker as any).openPopup();
      }
    }
  };

  const handleCall = (minsu: Minsu) => {
    setLocation(`/staff/call?id=${minsu.id}`);
  };

  // AI 推薦：紅星且分數最高的前 3 筆
  const aiRecommended = MOCK_MINSU_DATA
    .filter(m => m.pinStatus === 'red-star')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);

  return (
    <Layout role="staff">
      <PageHeader
        title="地圖作業"
        subtitle="宜蘭全區民宿開發地圖 — 點擊 Pin 查看詳情"
      />

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左側控制面板 */}
        <div className="w-72 border-r border-border bg-white flex flex-col overflow-hidden">
          {/* AI 推薦 */}
          <div className="p-4 border-b border-border bg-gradient-to-br from-orange-50 to-red-50">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={14} className="text-orange-500" />
              <span className="text-xs font-semibold text-orange-700">AI 推薦優先撥打</span>
            </div>
            <div className="space-y-2">
              {aiRecommended.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">評分 {m.aiScore}/50</div>
                  </div>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs flex-shrink-0"
                    style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                    onClick={() => handleCall(m)}
                  >
                    <Phone size={10} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 篩選器 */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Filter size={12} className="inline mr-1" />
              篩選条件
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pin 狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部顯示</SelectItem>
                {Object.entries(PIN_STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs">
                <ArrowUpDown size={12} className="mr-1" />
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">依 AI 評分排序</SelectItem>
                <SelectItem value="area">依地區排序</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pin 圖例 */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pin 狀態說明</div>
            <div className="space-y-2">
              {Object.entries(PIN_STATUS_CONFIG).map(([key, cfg]) => {
                const count = MOCK_MINSU_DATA.filter(m => m.pinStatus === key).length;
                return (
                  <div key={key} className="flex items-start justify-between text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{cfg.label}</div>
                      <div className="text-muted-foreground">{cfg.desc}</div>
                    </div>
                    <div className="font-semibold text-foreground ml-2">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 民宿清單 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs text-muted-foreground mb-2 font-medium">
                顯示 {filtered.length} 家民宿
              </div>
              <div className="space-y-1">
                {filtered.map(minsu => (
                  <div
                    key={minsu.id}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors text-sm group',
                      selectedMinsu?.id === minsu.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleSelectMinsu(minsu)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PIN_COLORS[minsu.pinStatus] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate text-xs">{minsu.name}</div>
                      <div className="text-xs text-muted-foreground">{minsu.area} · {minsu.aiScore}分</div>
                    </div>
                    {minsu.pinStatus === 'red-star' && (
                      <Star size={11} className="text-red-400 flex-shrink-0" fill="currentColor" />
                    )}
                    <ChevronRight size={11} className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>

        {/* 地圖 */}
        <div className="flex-1 relative">
          <MapView
            onMapReady={handleMapReady}
            initialCenter={{ lat: 24.7021, lng: 121.7377 }}
            initialZoom={11}
            markers={filtered.map(minsu => ({
              id: minsu.id,
              lat: markerLocationsRef.current.get(minsu.id)?.lat || 24.7021,
              lng: markerLocationsRef.current.get(minsu.id)?.lng || 121.7377,
              title: minsu.name,
              description: `${minsu.area} · ${minsu.phone}`,
              pinStatus: minsu.pinStatus,
            }))}
          />
          {/* 統計覆蓋層 */}
          <div className="absolute top-20 left-4 bg-white rounded-xl shadow-md p-3 text-xs">
            <div className="font-semibold text-foreground mb-2">本區統計</div>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">🔴⭐ 紅星（高潛力）</span>
                <span className="font-bold text-red-600">{MOCK_MINSU_DATA.filter(m => m.pinStatus === 'red-star').length} 家</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">🔴 紅標（一般）</span>
                <span className="font-bold text-red-400">{MOCK_MINSU_DATA.filter(m => m.pinStatus === 'red').length} 家</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">🟢 已加 LINE</span>
                <span className="font-bold text-green-600">{MOCK_MINSU_DATA.filter(m => m.pinStatus === 'green').length} 家</span>
              </div>
            </div>
          </div>

          {/* 選中民宿快速操作面板 - 移到右上角 */}
          {selectedMinsu && (
            <div className="absolute top-4 right-20 bg-white rounded-xl shadow-md p-3 w-64 z-10">
              <div className="font-semibold text-sm text-foreground mb-1">{selectedMinsu.name}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {selectedMinsu.area} · {selectedMinsu.phone}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                  onClick={() => handleCall(selectedMinsu)}
                >
                  <Phone size={11} />
                  撥打電話
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => setLocation(`/staff/detail?id=${selectedMinsu.id}`)}
                >
                  <Info size={11} />
                  查看詳情
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

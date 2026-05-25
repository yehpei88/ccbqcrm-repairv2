// CC 代客烤肉 CRM 系統 — 老闆地圖全覽頁面
// 設計：左側邊欄（篩選、Pin 圖例、民宿清單）+ 右側滿版地圖

import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, MINSU_COORDINATES, type Minsu } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Edit3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapView } from '@/components/Map';

const PIN_COLORS: Record<PinStatus, string> = {
  'red-star': '#ef4444',
  'red': '#f87171',
  'green': '#22c55e',
  'purple': '#a855f7',
  'gold': '#eab308',
};

export default function BossMap() {
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [editingMinsu, setEditingMinsu] = useState<Minsu | null>(null);
  const [editingStatus, setEditingStatus] = useState<PinStatus | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<PinStatus | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker | L.Marker>>(new Map());
  const markerLocationsRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  const filtered = MOCK_MINSU_DATA
    .filter(m => {
      if (filterStatus === 'all') return true;
      return m.pinStatus === filterStatus;
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  // 使用 geocodeAddress 進行地理編碼
  useEffect(() => {
    // 直接使用民宿資料中的坐標，無需地理編碼
    for (const minsu of MOCK_MINSU_DATA) {
      markerLocationsRef.current.set(minsu.id, {
        lat: minsu.latitude,
        lng: minsu.longitude,
      });
    }
  }, []);

  const [geocodingComplete] = useState(true);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  // 點擊民宿清單時縮放地圖並定位
  const handleSelectMinsu = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    
    // 使用民宿資料中的坐標直接縮放地圖，PIN 點居中
    if (mapRef.current) {
      // 直接設置為民宿坐標，讓 PIN 點完全居中在畫面中央
      mapRef.current.setView([minsu.latitude, minsu.longitude], 16);
      // 開啟 popup
      const marker = markersRef.current.get(minsu.id);
      if (marker && 'openPopup' in marker) {
        (marker as any).openPopup();
      }
    }
  };

  const handleEditPin = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    setNewStatus(minsu.pinStatus);
    setShowEditDialog(true);
  };

  const handleSavePin = () => {
    if (selectedMinsu && newStatus) {
      toast.success(`已將「${selectedMinsu.name}」的 Pin 狀態更新為「${PIN_STATUS_CONFIG[newStatus].label}」`);
      setShowEditDialog(false);
    }
  };

  return (
    <Layout role="boss">
      <PageHeader
        title="地圖全覽"
        subtitle="宜蘭全區民宿開發地圖 — 點擊 Pin 查看詳情"
      />

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左側邊欄 */}
        <div className="w-72 border-r border-border bg-white flex flex-col overflow-hidden">
          {/* 篩選區 */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              篩選 Pin 狀態
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部顯示</SelectItem>
                <SelectItem value="red-star">🔴⭐ 紅星</SelectItem>
                <SelectItem value="red">🔴 紅標</SelectItem>
                <SelectItem value="green">🟢 綠標</SelectItem>
                <SelectItem value="purple">🟣 紫標</SelectItem>
                <SelectItem value="gold">🟡 金標</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pin 圖例 */}
          <div className="px-3 py-2 border-b border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pin 狀態說明</div>
            <div className="space-y-1">
              {Object.entries(PIN_STATUS_CONFIG).map(([key, cfg]) => {
                const count = MOCK_MINSU_DATA.filter(m => m.pinStatus === key).length;
                return (
                  <div key={key} className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{cfg.label}</div>
                      <div className="text-xs text-muted-foreground">{cfg.desc}</div>
                    </div>
                    <div className="text-xs font-semibold text-foreground ml-2">{count}</div>
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
                      'flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-all',
                      selectedMinsu?.id === minsu.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    )}
                    onClick={() => handleSelectMinsu(minsu)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PIN_COLORS[minsu.pinStatus] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{minsu.name}</div>
                      <div className="text-xs text-muted-foreground">{minsu.area}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側地圖 */}
        <div className="flex-1 relative">
          <MapView
            onMapReady={handleMapReady}
            initialCenter={{ lat: 24.7021, lng: 121.7377 }}
            initialZoom={11}
            markers={geocodingComplete ? MOCK_MINSU_DATA.map(minsu => {
              const coords = markerLocationsRef.current.get(minsu.id) || { lat: minsu.latitude, lng: minsu.longitude };
              return {
                id: minsu.id,
                lat: coords.lat,
                lng: coords.lng,
                title: minsu.name,
                description: `${minsu.area} · ${minsu.phone}`,
                pinStatus: minsu.pinStatus,
              };
            }) : MOCK_MINSU_DATA.map(minsu => ({
              id: minsu.id,
              lat: minsu.latitude,
              lng: minsu.longitude,
              title: minsu.name,
              description: `${minsu.area} · ${minsu.phone}`,
              pinStatus: minsu.pinStatus,
            }))}
            key={geocodingComplete ? 'geocoded' : 'initial'}
          />

          {/* 選中民宿快速操作面板 */}
          {selectedMinsu && (
            <div className="absolute top-4 right-20 bg-white rounded-xl shadow-md p-4 w-80 z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedMinsu.name}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{selectedMinsu.area} · {selectedMinsu.phone}</div>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedMinsu(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pin 狀態</span>
                  <Badge className="text-xs">{PIN_STATUS_CONFIG[selectedMinsu.pinStatus].label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI 評分</span>
                  <span className="font-semibold">{selectedMinsu.aiScore}/50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">合作次數</span>
                  <span className="font-semibold">{selectedMinsu.cooperationCount} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LINE 狀態</span>
                  <span className="font-semibold">{selectedMinsu.lineAdded ? '✅ 已加入' : '❌ 未加入'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                  onClick={() => handleEditPin(selectedMinsu)}
                >
                  <Edit3 size={12} />
                  編輯 Pin
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setSelectedMinsu(null)}
                >
                  關閉
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 編輯 Pin 狀態 Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin size={16} />
              編輯 Pin 狀態 — {selectedMinsu?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMinsu && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-foreground">選擇新的 Pin 狀態</div>
              <Select value={newStatus || ''} onValueChange={(val) => setNewStatus(val as PinStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇 Pin 狀態" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PIN_STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label} — {cfg.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {newStatus && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-sm text-blue-700">
                  <div className="font-semibold mb-1">變更預覽</div>
                  <div>
                    {selectedMinsu.name} 的 Pin 狀態將從 <strong>{PIN_STATUS_CONFIG[selectedMinsu.pinStatus].label}</strong> 變更為 <strong>{PIN_STATUS_CONFIG[newStatus].label}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>取消</Button>
            <Button size="sm" onClick={handleSavePin} disabled={!newStatus}>確認變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

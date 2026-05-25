// CC 代客烤肉 CRM 系統 — 顧客開發人員地圖作業頁面
// 完全按照 GitHub v4 版本設計

import { useState, useEffect, useRef } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, AREA_ASSIGNMENTS, type Minsu } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Phone, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

type PinStatus = 'red-star' | 'red' | 'green' | 'purple' | 'gold' | 'gray';

const PIN_COLORS: Record<PinStatus, { icon: string; label: string; bg: string; color: string }> = {
  'red-star': { icon: '⭐', label: '🔴⭐ 紅星', bg: '#ef4444', color: '#fff' },
  'red': { icon: '🔴', label: '🔴 紅標', bg: '#f87171', color: '#fff' },
  'green': { icon: '🟢', label: '🟢 綠標', bg: '#22c55e', color: '#fff' },
  'purple': { icon: '🟣', label: '🟣 紫標', bg: '#a855f7', color: '#fff' },
  'gold': { icon: '🟡', label: '🟡 金標', bg: '#eab308', color: '#000' },
  'gray': { icon: '⚫', label: '⚫ 灰標', bg: '#6b7280', color: '#fff' },
};

export default function StaffMap() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');

  // 從 localStorage 獲取登入的顧客開發人員信息
  const staffId = localStorage.getItem('staffId');
  const staffName = localStorage.getItem('staffName');
  const assignedAreasStr = localStorage.getItem('assignedAreas');
  const assignedAreas = assignedAreasStr ? JSON.parse(assignedAreasStr) : [];

  // 如果未登入，重定向到登入頁
  useEffect(() => {
    if (!staffId) {
      setLocation('/');
    }
  }, [staffId, setLocation]);

  // 過濾該顧客開發人員分配區域的民宿
  const assignedMinsu = MOCK_MINSU_DATA.filter(m => assignedAreas.includes(m.area));

  // 應用篩選
  const filteredMinsu = assignedMinsu
    .filter(m => filterStatus === 'all' || m.pinStatus === filterStatus)
    .filter(m => filterArea === 'all' || m.area === filterArea);

  // AI 推薦優先撥打（紅星民宿，按 AI 評分排序，最多 3 家）
  const aiRecommended = assignedMinsu
    .filter(m => m.pinStatus === 'red-star')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);

  // 計算各狀態民宿數量
  const pinCounts = Object.keys(PIN_COLORS).reduce((acc, status) => {
    acc[status as PinStatus] = assignedMinsu.filter(m => m.pinStatus === status).length;
    return acc;
  }, {} as Record<PinStatus, number>);

  // 初始化 Leaflet 地圖
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([24.72, 121.75], 11);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 更新地圖標記
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filteredMinsu.forEach((minsu: Minsu) => {
      const pinColor = PIN_COLORS[minsu.pinStatus as PinStatus]?.bg || '#6b7280';

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${pinColor}; border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: bold; color: ${PIN_COLORS[minsu.pinStatus as PinStatus]?.color || '#fff'};
        ">${minsu.pinStatus === 'red-star' ? '⭐' : ''}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([minsu.latitude, minsu.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setSelectedMinsu(minsu);
          mapInstanceRef.current.setView([minsu.latitude, minsu.longitude], 15);
        });

      marker.bindTooltip(minsu.name, { 
        direction: 'top', 
        offset: [0, -15],
        permanent: false,
      });

      markersRef.current.push(marker);
    });
  }, [filteredMinsu]);

  const handleCall = (minsu: Minsu) => {
    setLocation(`/staff/call?id=${minsu.id}`);
  };

  const getUniqueAreas = () => {
    const areas = new Set(assignedMinsu.map(m => m.area));
    return Array.from(areas);
  };

  return (
    <Layout role="staff">
      <PageHeader
        title="地圖作業"
        subtitle={`${staffName} · 負責區域：${assignedAreas.join('、')}`}
      />

      <div className="flex h-[calc(100vh-73px)] bg-slate-50">
        {/* 左側邊欄 */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* 頂部標題 */}
          <div className="p-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                🔥
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900">CC 代客烤肉 CRM</div>
                <div className="text-xs text-slate-500">顧客開發人員作業平台</div>
              </div>
            </div>
          </div>

          {/* AI 推薦優先撥打 */}
          <div className="p-3 border-b border-slate-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-red-500 fill-red-500" />
              <span className="text-sm font-semibold text-red-700">AI 推薦優先撥打</span>
            </div>
            <div className="space-y-1.5">
              {aiRecommended.length > 0 ? (
                aiRecommended.map((minsu, idx) => (
                  <div
                    key={minsu.id}
                    onClick={() => setSelectedMinsu(minsu)}
                    className="p-2 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow border border-red-100 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{idx + 1}. {minsu.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{minsu.area}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2 bg-red-100 text-red-700 font-semibold">
                        {minsu.aiScore}/50
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-2">
                  暫無紅星民宿
                </div>
              )}
            </div>
          </div>

          {/* 篩選器 */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">主選擇器</div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pin 狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部顯示</SelectItem>
                {Object.entries(PIN_COLORS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-2">主題篩選</div>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="地區" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部地區</SelectItem>
                {getUniqueAreas().map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PIN 狀態說明 */}
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">PIN 狀態說明</div>
            <div className="space-y-1">
              {Object.entries(PIN_COLORS).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full`} style={{ background: config.bg }} />
                    <span className="text-slate-700">{config.label}</span>
                  </div>
                  <span className="font-semibold text-slate-600">{pinCounts[key as PinStatus] || 0} 家</span>
                </div>
              ))}
            </div>
          </div>

          {/* 民宿清單 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-1">
              <div className="text-xs text-slate-500 mb-2 font-medium">
                顯示 {filteredMinsu.length} 家民宿
              </div>
              {filteredMinsu.map((minsu) => (
                <div
                  key={minsu.id}
                  onClick={() => setSelectedMinsu(minsu)}
                  className={`p-2 rounded-lg cursor-pointer transition-all text-xs group ${
                    selectedMinsu?.id === minsu.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {minsu.pinStatus === 'red-star' && <Star className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{minsu.name}</div>
                      <div className="text-xs text-slate-500">{minsu.area} · {minsu.aiScore}分</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中間：地圖容器 */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* 右側：民宿詳情卡片 */}
          {selectedMinsu && (
            <div className="absolute top-4 right-4 w-80 max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-lg shadow-lg border border-slate-200 z-10">
              {/* 卡片頭部 */}
              <div className="p-4 border-b border-slate-200 sticky top-0 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{selectedMinsu.name}</h3>
                    <Badge className="mt-2 text-xs bg-red-100 text-red-700 font-semibold">
                      {PIN_COLORS[selectedMinsu.pinStatus as PinStatus]?.label} · AI {selectedMinsu.aiScore}/50
                    </Badge>
                  </div>
                  <button
                    onClick={() => setSelectedMinsu(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 卡片內容 */}
              <div className="p-4 space-y-4 text-xs">
                {/* 基本資料 */}
                <div className="space-y-2">
                  <div className="text-slate-600 font-semibold text-xs">基本資料</div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-500 text-xs">地址</span>
                      <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 text-xs">電話</span>
                        <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.phone}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">地區</span>
                        <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.area}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 聯繫方式 */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-600 font-semibold text-xs">聯繫方式</span>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-900">{selectedMinsu.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <span className="text-sm">💬</span>
                      <span className="font-medium text-slate-900">
                        LINE 狀態：{selectedMinsu.pinStatus === 'green' ? '✅ 已加' : '❌ 未加'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 合作狀態 */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-slate-600 font-semibold text-xs">合作狀態</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-500 text-xs">合作狀態</span>
                      <p className="font-medium text-slate-900 mt-1">
                        {selectedMinsu.pinStatus === 'purple' ? '合作中' : '未合作'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-500 text-xs">AI 評分</span>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.aiScore}/50</p>
                    </div>
                  </div>
                </div>

                {/* 備注 */}
                {selectedMinsu.note && (
                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-slate-600 font-semibold text-xs">備注</span>
                    <p className="text-slate-700 bg-slate-50 p-2 rounded mt-2 text-xs">{selectedMinsu.note}</p>
                  </div>
                )}

                {/* 快速操作 */}
                <div className="border-t border-slate-200 pt-3">
                  <Button
                    className="w-full h-9 text-sm gap-2 font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                    onClick={() => handleCall(selectedMinsu)}
                  >
                    <Phone className="w-4 h-4" />
                    聯繫完成
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// CC 代客烤肉 CRM 系統 — 顧客開發人員地圖作業頁面
// 設計：左側 AI 推薦 + PIN 說明、中間滿版 Leaflet 地圖、右側民宿詳情卡片
// 基於 GitHub v4 版本，保持區域過濾邏輯

import { useState, useEffect, useRef } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, AREA_ASSIGNMENTS, type Minsu } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Phone, Filter } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

type PinStatus = 'red-star' | 'red' | 'green' | 'purple' | 'gold' | 'gray';

const PIN_COLORS: Record<PinStatus, { label: string; color: string; bg: string }> = {
  'red-star': { label: '🔴⭐ 紅星', color: '#ef4444', bg: '#ef4444' },
  'red': { label: '🔴 紅標', color: '#f87171', bg: '#f87171' },
  'green': { label: '🟢 綠標', color: '#22c55e', bg: '#22c55e' },
  'purple': { label: '🟣 紫標', color: '#a855f7', bg: '#a855f7' },
  'gold': { label: '🟡 金標', color: '#eab308', bg: '#eab308' },
  'gray': { label: '⚫ 灰標', color: '#6b7280', bg: '#6b7280' },
};

export default function StaffMap() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');

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

  // 應用篩選和排序
  const filteredMinsu = assignedMinsu
    .filter(m => filterStatus === 'all' || m.pinStatus === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'score') return b.aiScore - a.aiScore;
      if (sortBy === 'area') return a.area.localeCompare(b.area);
      return 0;
    });

  // AI 推薦優先撥打（紅星民宿，按 AI 評分排序）
  const aiRecommended = assignedMinsu
    .filter(m => m.pinStatus === 'red-star')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);

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
          width: 32px; height: 32px; border-radius: 50%;
          background: ${pinColor}; border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: bold; color: white;
        ">${minsu.pinStatus === 'red-star' ? '⭐' : ''}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([minsu.latitude, minsu.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => {
          setSelectedMinsu(minsu);
          mapInstanceRef.current.setView([minsu.latitude, minsu.longitude], 15);
        });

      marker.bindTooltip(`${minsu.name} (${minsu.aiScore}分)`, { 
        direction: 'top', 
        offset: [0, -16],
        permanent: false,
      });

      markersRef.current.push(marker);
    });
  }, [filteredMinsu]);

  const handleCall = (minsu: Minsu) => {
    setLocation(`/staff/call?id=${minsu.id}`);
  };

  const handleViewDetail = (minsu: Minsu) => {
    setLocation(`/staff/detail?id=${minsu.id}`);
  };

  return (
    <Layout role="staff">
      <PageHeader
        title="地圖作業"
        subtitle={`${staffName} · 負責區域：${assignedAreas.join('、')}`}
      />

      <div className="flex h-[calc(100vh-73px)] bg-slate-50">
        {/* 左側邊欄：AI 推薦 + PIN 說明 */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* AI 推薦優先撥打 */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-br from-orange-50 to-red-50">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-semibold text-orange-700">AI 推薦優先撥打</span>
            </div>
            <div className="space-y-2">
              {aiRecommended.length > 0 ? (
                aiRecommended.map((minsu, idx) => (
                  <div
                    key={minsu.id}
                    onClick={() => setSelectedMinsu(minsu)}
                    className="p-3 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-slate-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-900">{minsu.name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {minsu.area} · AI {minsu.aiScore}/50
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs ml-2">#{idx + 1}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-2 h-7 text-xs gap-1"
                      style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(minsu);
                      }}
                    >
                      <Phone className="w-3 h-3" />
                      撥打電話
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">
                  暫無紅星民宿
                </div>
              )}
            </div>
          </div>

          {/* 篩選器 */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" />
              篩選條件
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
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">依 AI 評分排序</SelectItem>
                <SelectItem value="area">依地區排序</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PIN 狀態說明 */}
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Pin 狀態說明</div>
            <div className="space-y-2">
              {Object.entries(PIN_COLORS).map(([key, config]) => {
                const count = assignedMinsu.filter(m => m.pinStatus === key).length;
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ background: config.bg }} />
                      <span className="text-slate-700">{config.label}</span>
                    </div>
                    <span className="font-semibold text-slate-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 民宿清單 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-1">
              <div className="text-xs text-slate-500 mb-2 font-medium">
                顯示 {filteredMinsu.length} 家民宿
              </div>
              {filteredMinsu.map(minsu => (
                <div
                  key={minsu.id}
                  onClick={() => setSelectedMinsu(minsu)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all text-xs group ${
                    selectedMinsu?.id === minsu.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: PIN_COLORS[minsu.pinStatus as PinStatus]?.bg }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{minsu.name}</div>
                      <div className="text-xs text-slate-500">{minsu.area} · {minsu.aiScore}分</div>
                    </div>
                    {minsu.pinStatus === 'red-star' && (
                      <Star className="w-3 h-3 text-red-400 flex-shrink-0 fill-red-400" />
                    )}
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
            <div className="absolute top-4 right-4 w-80 max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 z-10">
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-base text-slate-900">{selectedMinsu.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedMinsu.area}</p>
                  </div>
                  <button
                    onClick={() => setSelectedMinsu(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <Badge variant="outline" className="text-xs">
                  {PIN_COLORS[selectedMinsu.pinStatus as PinStatus]?.label} · AI {selectedMinsu.aiScore}/50
                </Badge>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* 基本資訊 */}
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500">地址</span>
                    <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">類型</span>
                      <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.type || '民宿'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">合作次數</span>
                      <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.cooperationCount}</p>
                    </div>
                  </div>
                </div>

                {/* 聯繫方式 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-semibold mb-2">聯繫方式</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{selectedMinsu.phone}</span>
                    </div>
                    {selectedMinsu.lineId && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <span className="text-lg">💬</span>
                        <span className="font-medium text-slate-900">{selectedMinsu.lineId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 合作信息 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-semibold mb-2">合作信息</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-500">LINE 狀態</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {selectedMinsu.pinStatus === 'green' ? '✅ 已加' : '❌ 未加'}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="text-slate-500">合作狀態</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {selectedMinsu.pinStatus === 'purple' ? '合作中' : '未合作'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 備注 */}
                {selectedMinsu.note && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="text-slate-600 font-semibold mb-2">備注</div>
                    <p className="text-slate-700 bg-slate-50 p-2 rounded">{selectedMinsu.note}</p>
                  </div>
                )}

                {/* 快速操作 */}
                <div className="border-t border-slate-200 pt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1"
                    style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                    onClick={() => handleCall(selectedMinsu)}
                  >
                    <Phone className="w-3 h-3" />
                    撥打電話
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => handleViewDetail(selectedMinsu)}
                  >
                    查看詳情
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

// CC 代客烤肉 CRM 系統 — 老闆地圖作業頁面
// 設計：上方標題 + Pin 篩選 + 左側滿版地圖 + 右側民宿詳情卡片
// 基於 GitHub v4 版本，保持工讀生區域指派邏輯

import { useState, useEffect, useRef } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, type Minsu } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type PinStatus = keyof typeof PIN_STATUS_CONFIG;

export default function BossMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedPin, setSelectedPin] = useState<string>('all');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);

  const filteredMinsu = selectedPin === 'all'
    ? MOCK_MINSU_DATA
    : MOCK_MINSU_DATA.filter((m: Minsu) => m.pinStatus === selectedPin);

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
      const markerColor = minsu.pinStatus === 'red-star' ? '#ef4444' :
        minsu.pinStatus === 'red' ? '#ef4444' :
        minsu.pinStatus === 'green' ? '#22c55e' :
        minsu.pinStatus === 'purple' ? '#a855f7' : '#eab308';

      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="
          width: 24px; height: 24px; border-radius: 50%;
          background: ${markerColor}; border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
        ">${minsu.pinStatus === 'red-star' ? '⭐' : ''}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([minsu.latitude, minsu.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .on('click', () => setSelectedMinsu(minsu));

      marker.bindTooltip(`${minsu.name} (${minsu.aiScore}分)`, { direction: 'top', offset: [0, -12] });
      markersRef.current.push(marker);
    });
  }, [filteredMinsu]);

  return (
    <Layout role="boss">
      <PageHeader
        title="地圖作業"
        subtitle="宜蘭全區民宿開發地圖 — 點擊 Pin 查看詳情"
      />

      <div className="p-6 space-y-4 h-[calc(100vh-73px)] flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">民宿分佈地圖</h2>
            <p className="text-sm text-slate-500">共 {MOCK_MINSU_DATA.length} 家民宿 · 顯示 {filteredMinsu.length} 家</p>
          </div>
          <Select value={selectedPin} onValueChange={setSelectedPin}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="篩選 Pin 狀態" />
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

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* 地圖容器 */}
          <div ref={mapRef} className="flex-1 rounded-xl overflow-hidden border shadow-sm" />

          {/* 右側民宿詳情卡片 */}
          {selectedMinsu && (
            <Card className="w-80 overflow-y-auto shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedMinsu.name}</CardTitle>
                  <button 
                    onClick={() => setSelectedMinsu(null)} 
                    className="text-slate-400 hover:text-slate-600 text-xl"
                  >
                    ×
                  </button>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {selectedMinsu.pinStatus === 'gold' ? '🟡 金標' :
                   selectedMinsu.pinStatus === 'purple' ? '🟣 紫標' :
                   selectedMinsu.pinStatus === 'green' ? '🟢 綠標' :
                   selectedMinsu.pinStatus === 'red-star' ? '🔴⭐ 紅星' : '🔴 紅標'}
                  · AI {selectedMinsu.aiScore}/50
                </Badge>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500">電話</span>
                    <p className="font-medium">{selectedMinsu.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">地區</span>
                    <p className="font-medium">{selectedMinsu.area}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">地址</span>
                    <p className="font-medium">{selectedMinsu.address}</p>
                  </div>

                  <div>
                    <span className="text-slate-500">合作次數</span>
                    <p className="font-medium">{selectedMinsu.cooperationCount} 次</p>
                  </div>
                </div>
                {selectedMinsu.note && (
                  <div>
                    <p className="text-slate-500 mb-1">備注</p>
                    <p className="bg-slate-50 p-1.5 rounded">{selectedMinsu.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

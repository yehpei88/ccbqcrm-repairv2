// CC 代客烤肉 CRM 系統 — 顧客開發人員地圖作業頁面
// 完全按照 GitHub v4 版本設計

import { useState, useEffect, useRef } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, AREA_ASSIGNMENTS, type Minsu, type CallResult } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Phone, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { ContactCompleteDialog } from '@/components/ContactCompleteDialog';

type PinStatus = 'red-star' | 'red' | 'green' | 'purple' | 'gold';

const PIN_COLORS: Record<PinStatus, { icon: string; label: string; bg: string; color: string }> = {
  'red-star': { icon: '⭐', label: '🔴⭐ 紅星', bg: '#ef4444', color: '#fff' },
  'red': { icon: '🔴', label: '🔴 紅標', bg: '#f87171', color: '#fff' },
  'green': { icon: '🟢', label: '🟢 綠標', bg: '#22c55e', color: '#fff' },
  'purple': { icon: '🟣', label: '🟣 紫標', bg: '#a855f7', color: '#fff' },
  'gold': { icon: '🟡', label: '🟡 金標', bg: '#eab308', color: '#000' },
};

export default function StaffMap() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [minsuData, setMinsuData] = useState<Record<string, Minsu>>(
    MOCK_MINSU_DATA.reduce((acc, m) => ({ ...acc, [m.id]: m }), {})
  );

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
  const assignedMinsu = Object.values(minsuData).filter(m => assignedAreas.includes(m.area));

  // 應用篩選
  const filteredMinsu = assignedMinsu
    .filter(m => filterStatus === 'all' || m.pinStatus === filterStatus)
    .filter(m => filterArea === 'all' || m.area === filterArea);

  // AI 推薦優先撥打（紅星民宿，按 AI 評分排序，最多 3 家）
  const aiRecommended = assignedMinsu
    .filter(m => m.pinStatus === 'red-star')
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);

  // 根據通話結果判斷 Pin 狀態
  const getPinStatusFromCallResult = (callResult: CallResult, minsu: Minsu): PinStatus => {
    if (minsu.cooperationCount >= 3) return 'gold';
    if (minsu.cooperationCount > 0) return 'purple';
    if (callResult === 'agreed') return 'green';
    if (minsu.pinStatus === 'red-star') return 'red-star';
    return 'red';
  };

  // 計算 PIN 狀態計數
  const pinCounts: Record<PinStatus, number> = {
    'red-star': 0,
    'red': 0,
    'green': 0,
    'purple': 0,
    'gold': 0,
  };
  assignedMinsu.forEach(m => {
    pinCounts[m.pinStatus as PinStatus]++;
  });

  // 獲取唯一的地區列表
  const getUniqueAreas = () => {
    return [...new Set(assignedMinsu.map(m => m.area))].sort();
  };

  // 初始化 Leaflet 地圖
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([24.8, 121.0], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 更新地圖標記
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 清除舊標記
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // 添加新標記
    filteredMinsu.forEach(minsu => {
      const L = (window as any).L;
      const pinColor = PIN_COLORS[minsu.pinStatus as PinStatus];

      const marker = L.marker([minsu.latitude, minsu.longitude], {
        title: minsu.name,
      })
        .bindPopup(`<div class="text-sm font-bold">${minsu.name}</div>`)
        .addTo(map);

      // 自定義標記圖標
      const icon = L.divIcon({
        html: `<div style="background-color: ${pinColor.bg}; color: ${pinColor.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-center; font-size: 16px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${pinColor.icon}</div>`,
        iconSize: [32, 32],
        className: 'custom-marker',
      });
      marker.setIcon(icon);

      marker.on('click', () => {
        setSelectedMinsu(minsuData[minsu.id]);
      });

      markersRef.current.push(marker);
    });
  }, [filteredMinsu, minsuData]);

  // 加載 Leaflet 庫
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <Layout role="staff">
      <PageHeader
        title={`地圖作業 - ${staffName}`}
        subtitle={`負責區域: ${assignedAreas.join('、')} — 共 ${assignedMinsu.length} 家民宿`}
      />

      <div className="flex h-[calc(100vh-120px)] gap-0">
        {/* 左側邊欄 */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* AI 推薦優先撥打 */}
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">⭐ AI 推薦優先撥打</div>
            <div className="space-y-1">
              {aiRecommended.length > 0 ? (
                aiRecommended.map((minsu) => (
                  <div
                    key={minsu.id}
                    onClick={() => setSelectedMinsu(minsu)}
                    className={`p-2 rounded-lg cursor-pointer transition-all text-xs group ${
                      selectedMinsu?.id === minsu.id
                        ? 'bg-red-50 border border-red-200'
                        : 'hover:bg-red-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{minsu.name}</div>
                        <div className="text-xs text-slate-500">{minsu.area} · {minsu.aiScore}分</div>
                      </div>
                      <Badge className="text-xs bg-red-100 text-red-700 font-semibold flex-shrink-0">
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
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">主選擇器</div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="全部顯示" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部顯示</SelectItem>
                  {Object.entries(PIN_COLORS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="全部地區" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部地區</SelectItem>
                  {getUniqueAreas().map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PIN 狀態說明 */}
          <div className="p-3 border-b border-slate-200">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">PIN 狀態說明</div>
            <div className="space-y-1">
              {Object.entries(PIN_COLORS).map(([key, config]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{config.label}</span>
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
        <div className="flex-1 relative z-0">
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>

      {/* 右側：民宿詳情卡片 - 放在最外層確保不被遮擋 */}
      {selectedMinsu && (
        <div className="fixed top-20 right-4 w-96 max-h-[calc(100vh-100px)] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
          {/* 卡片頭部 */}
          <div className="p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900">{selectedMinsu.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs bg-red-100 text-red-700 font-semibold">
                    {PIN_COLORS[selectedMinsu.pinStatus as PinStatus]?.label}
                  </Badge>
                  <span className="text-xs text-slate-500">AI {selectedMinsu.aiScore}/50</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMinsu(null)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 卡片內容 */}
          <div className="p-4 space-y-4">
            {/* 基本資料 */}
            <div className="space-y-3">
              <div className="text-slate-600 font-bold text-sm">基本資料</div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 text-xs font-medium">地址</span>
                  <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-xs font-medium">電話</span>
                    <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-medium">地區</span>
                    <p className="font-medium text-slate-900 mt-0.5">{selectedMinsu.area}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細信息 */}
            <div className="border-t border-slate-200 pt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">類型</span>
                  <p className="font-medium text-slate-900 mt-1">民宿</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">雨棚</span>
                  <p className="font-medium text-slate-900 mt-1">{selectedMinsu.hasRainShelter ? '有' : '無'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">負責聯絡員</span>
                  <p className="font-medium text-slate-900 mt-1">待指定</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">通話結果</span>
                  <p className="font-medium text-slate-900 mt-1">{selectedMinsu.callResult ? '已聯繫' : '未聯繫'}</p>
                </div>
              </div>
            </div>

            {/* 通話狀態 */}
            <div className="border-t border-slate-200 pt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">AI 意向</span>
                  <p className="font-medium text-slate-900 mt-1">—</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">LINE 狀態</span>
                  <p className="font-medium text-slate-900 mt-1">
                    {selectedMinsu.lineAdded ? '✅ 已加入' : '❌ 未加入'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">合作次數</span>
                  <p className="font-medium text-slate-900 mt-1">{selectedMinsu.cooperationCount} 次</p>
                </div>
              </div>
            </div>

            {/* AI 推薦評分 */}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 font-bold text-sm">總分</span>
                <span className="text-slate-900 font-bold text-sm">{selectedMinsu.aiScore}/50</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full transition-all"
                  style={{ width: `${(selectedMinsu.aiScore / 50) * 100}%` }}
                />
              </div>
            </div>

            {/* 備注 */}
            {selectedMinsu.note && (
              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-600 font-bold text-sm">備注</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded mt-2 text-xs">{selectedMinsu.note}</p>
              </div>
            )}

            {/* 快速操作 */}
            <div className="border-t border-slate-200 pt-4">
              <Button
                className="w-full h-10 text-sm gap-2 font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg"
                onClick={() => setShowContactDialog(true)}
              >
                <Phone className="w-4 h-4" />
                聯繫完成
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 聯繫完成對話框 */}
      <ContactCompleteDialog
        open={showContactDialog}
        minsu={selectedMinsu}
        onOpenChange={setShowContactDialog}
        onSave={(data) => {
          if (selectedMinsu) {
            // Step 7-8: 更新民宿的數據和 Pin 狀態
            const updatedMinsu: Minsu = {
              ...selectedMinsu,
              callResult: data.callResult,
              lineAdded: data.callResult === 'agreed' ? true : selectedMinsu.lineAdded,
              lineId: data.lineId || selectedMinsu.lineId,
              note: data.note || selectedMinsu.note,
              quickTags: data.quickTags || selectedMinsu.quickTags,
              // 根據通話結果更新 Pin 狀態
              pinStatus: getPinStatusFromCallResult(data.callResult, selectedMinsu),
              // 記錄通話時間
              callSummaries: [
                ...(selectedMinsu.callSummaries || []),
                {
                  id: `call-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  summary: data.note || '',
                  intentLabel: 'inquiring',
                  source: 'manual',
                },
              ],
            };

            // 更新數據存儲
            setMinsuData(prev => ({ ...prev, [selectedMinsu.id]: updatedMinsu }));
            setSelectedMinsu(updatedMinsu);

            toast.success(`已登錄「${selectedMinsu.name}」的通話結果`);
            if (data.callResult === 'agreed') {
              toast.success('🎉 已觸發自動化流程：LINE 邀請 + 菜單已自動發送！', { duration: 4000 });
            }
          }
        }}
      />
    </Layout>
  );
}

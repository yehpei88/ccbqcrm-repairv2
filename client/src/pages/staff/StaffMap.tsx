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

  // 計算 AI 推薦優先撥打的民宿（紅星 + 未開發）
  const aiRecommended = Object.values(minsuData)
    .filter(m => m.pinStatus === 'red-star' && !m.callResult && assignedAreas.includes(m.area))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);

  // 篩選民宿
  const filteredMinsu = Object.values(minsuData).filter(minsu => {
    if (!assignedAreas.includes(minsu.area)) return false;
    if (filterArea !== 'all' && minsu.area !== filterArea) return false;
    if (filterStatus === 'developed' && !minsu.callResult) return false;
    if (filterStatus === 'undeveloped' && minsu.callResult) return false;
    return true;
  });

  const assignedMinsu = Object.values(minsuData).filter(m => assignedAreas.includes(m.area));

  // 初始化地圖
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([24.7, 121.7], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
  }, []);

  // 更新地圖標記
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    filteredMinsu.forEach((minsu) => {
      const L = (window as any).L;
      const pinColor = PIN_COLORS[minsu.pinStatus as PinStatus];

      const icon = L.divIcon({
        html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, ${pinColor.bg} 0%, ${pinColor.bg}dd 100%);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.3);
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
          position: relative;
        ">
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent);
            pointer-events: none;
          "></div>
          <span style="position: relative; z-index: 1; line-height: 1;">${pinColor.icon}</span>
        </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        className: 'custom-marker',
      });
      
      const marker = L.marker([minsu.latitude, minsu.longitude], { icon }).addTo(mapInstanceRef.current);
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
                  <SelectItem value="developed">已開發</SelectItem>
                  <SelectItem value="undeveloped">未開發</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="全部區域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部區域</SelectItem>
                  {assignedAreas.map((area: string) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 民宿清單 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-1">
              <div className="text-xs text-slate-500 mb-2 font-medium">
                顯示 {filteredMinsu.length} 家民宿
              </div>
              {filteredMinsu.map((minsu) => {
                const pinColor = PIN_COLORS[minsu.pinStatus as PinStatus];
                return (
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
                      {minsu.pinStatus === 'red-star' ? (
                        <Star className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                      ) : (
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: pinColor.bg }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{minsu.name}</div>
                        <div className="text-xs text-slate-500">{minsu.area} · {minsu.aiScore}分</div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900">{selectedMinsu.name}</h3>
              </div>
              <button
                onClick={() => setSelectedMinsu(null)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-yellow-100 text-yellow-700 font-semibold">
                {selectedMinsu.pinStatus === 'gold' ? '金標' : selectedMinsu.pinStatus === 'purple' ? '紫標' : selectedMinsu.pinStatus === 'green' ? '綠標' : selectedMinsu.pinStatus === 'red-star' ? '紅星' : '紅標'}
              </Badge>
              <span className="text-xs text-slate-600">AI 評分：<span className="font-semibold">{selectedMinsu.aiScore}/50</span></span>
            </div>
          </div>

          {/* 卡片內容 */}
          <div className="p-4 space-y-4">
            {selectedMinsu.callResult ? (
              // 已開發民宿 - 完整詳情
              <>
                {/* VIP 客戶標籤 */}
                {selectedMinsu.pinStatus === 'gold' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="text-lg">👑</div>
                      <div className="flex-1">
                        <div className="font-bold text-yellow-800 text-sm">VIP 客戶回訪提醒</div>
                        <div className="text-xs text-yellow-700 mt-1">已合作 4 次，建議回訪日：2026-05-28</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 基本資料 */}
                <div>
                  <div className="text-slate-600 font-bold text-sm mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    基本資料
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">地址</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.address}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">電話</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.phone}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">地區</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.area}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">類型</div>
                      <p className="font-medium text-slate-900 mt-1">農家樂民宿</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">請聯</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.hasRainShelter ? '有雨棚' : '無雨棚'}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">負責人</div>
                      <p className="font-medium text-slate-900 mt-1">林小美</p>
                    </div>
                  </div>
                </div>

                {/* 開發狀態 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-bold text-sm mb-3">開發狀態</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">通話結果</div>
                      <p className="font-medium text-slate-900 mt-1">通話結果黑</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">AI 意向</div>
                      <p className="font-medium text-slate-900 mt-1">🔥</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">LINE 狀態</div>
                      <p className="font-medium text-slate-900 mt-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        已加入
                      </p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">合作次數</div>
                      <p className="font-medium text-slate-900 mt-1">4 次</p>
                    </div>
                  </div>
                </div>

                {/* AI 潛力評分 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-bold text-sm mb-3">AI 潛力評分</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs">總分</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full"
                          style={{ width: `${(selectedMinsu.aiScore / 50) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 text-xs">{selectedMinsu.aiScore}/50</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <span>✅</span>
                      <span>達到紅星門檻（≥ 20 分），建議優先開發</span>
                    </div>
                  </div>
                </div>

                {/* 歷史備注 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-bold text-sm mb-2">歷史備注</div>
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-slate-500">• VIP 客戶</div>
                      <div className="text-slate-500">• 農家樂超大</div>
                      <div className="text-slate-500">• 每次合作都 50 人以上</div>
                      <div className="text-slate-500">• 老闆很配合</div>
                      <div className="text-slate-500">• 有重點回訪</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // 未開發民宿 - 簡化詳情
              <>
                {/* 基本資料 */}
                <div>
                  <div className="text-slate-600 font-bold text-sm mb-3">基本資料</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500 font-medium">地址</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.address}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">電話</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.phone}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">地區</div>
                      <p className="font-medium text-slate-900 mt-1">{selectedMinsu.area}</p>
                    </div>
                    <div>
                      <div className="text-slate-500 font-medium">類型</div>
                      <p className="font-medium text-slate-900 mt-1">民宿</p>
                    </div>
                  </div>
                </div>

                {/* AI 評分 */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-slate-600 font-bold text-sm mb-2">AI 評分</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-full rounded-full"
                        style={{ width: `${(selectedMinsu.aiScore / 50) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{selectedMinsu.aiScore}/50</span>
                  </div>
                </div>

                {/* 聯繫完成按鈕 */}
                <div className="border-t border-slate-200 pt-4">
                  <Button
                    className="w-full h-10 text-sm gap-2 font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg"
                    onClick={() => setShowContactDialog(true)}
                  >
                    <Phone className="w-4 h-4" />
                    聯繫完成
                  </Button>
                </div>
              </>
            )}
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
                  intentLabel: 'seen',
                  source: 'manual',
                },
              ],
            };

            setMinsuData(prev => ({
              ...prev,
              [selectedMinsu.id]: updatedMinsu,
            }));

            setSelectedMinsu(updatedMinsu);
            setShowContactDialog(false);
            toast.success(`已更新「${selectedMinsu.name}」的聯繫記錄`);
          }
        }}
      />
    </Layout>
  );
}

// 根據通話結果決定 Pin 狀態
function getPinStatusFromCallResult(callResult: CallResult, minsu: Minsu): PinStatus {
  if (callResult === 'agreed') {
    return 'green'; // 答應加賴 → 綠標
  } else if (callResult === 'rejected') {
    return 'red'; // 拒絕 → 紅標
  } else if (callResult === 'hesitating') {
    return 'red'; // 猶豫中 → 紅標
  } else {
    return minsu.pinStatus; // 其他情況保持原狀
  }
}

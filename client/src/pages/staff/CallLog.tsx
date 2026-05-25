// CC 代客烤肉 CRM 系統 — 顧客開發人員個人工作紀錄頁面
// 設計：績效看板 + 已完成撥打歷史清單

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, CALL_RESULT_CONFIG, PIN_STATUS_CONFIG, type Minsu, type CallResult } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone, Search, CheckCircle, Clock, XCircle,
  PhoneOff, Store, ChevronDown, ChevronUp, Star,
  MessageSquare, FileText, TrendingUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const RESULT_ICONS: Record<CallResult, React.ReactNode> = {
  'agreed': <CheckCircle size={16} className="text-green-500" />,
  'hesitating': <Clock size={16} className="text-yellow-500" />,
  'rejected': <XCircle size={16} className="text-red-500" />,
  'invalid': <PhoneOff size={16} className="text-gray-400" />,
  'closed': <Store size={16} className="text-gray-400" />,
  'missed': <PhoneOff size={16} className="text-gray-500" />,
};

// 模擬已完成撥打的歷史紀錄（本月數據）
const MOCK_CALL_HISTORY = [
  { id: 'm001', name: '礁溪溫泉秘湯', area: '礁溪鄉', phone: '03-9871234', result: 'agreed' as CallResult, time: '今天 14:30', lineId: 'chen_minsu_001' },
  { id: 'm002', name: '員山梅花湖民宿', area: '員山鄉', phone: '03-9221234', result: 'hesitating' as CallResult, time: '今天 13:15', note: '對方說下週再聯絡' },
  { id: 'm003', name: '壯圍海岸民宿', area: '壯圍鄉', phone: '03-9381234', result: 'rejected' as CallResult, time: '昨天 16:45', note: '婉拒，暫時不考慮' },
  { id: 'm004', name: '礁溪山景民宿', area: '礁溪鄉', phone: '03-9561234', result: 'agreed' as CallResult, time: '昨天 15:20', lineId: 'mountain_view_01' },
  { id: 'm005', name: '員山竹林小屋', area: '員山鄉', phone: '03-9441234', result: 'missed' as CallResult, time: '3 天前 10:00', note: '未接，稍後再試' },
];

function CallResultButton({
  result,
  selected,
  onClick,
}: {
  result: CallResult;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = CALL_RESULT_CONFIG[result];
  return (
    <button
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium w-full',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
      onClick={onClick}
    >
      {RESULT_ICONS[result]}
      <span className={cn(selected ? 'text-primary' : 'text-foreground')}>{cfg.label}</span>
    </button>
  );
}

export default function CallLog() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<typeof MOCK_CALL_HISTORY[0] | null>(null);

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

  // 篩選搜尋結果
  const filtered = MOCK_CALL_HISTORY.filter(record =>
    !search || record.name.includes(search) || record.area.includes(search) || record.phone.includes(search)
  );

  // 計算績效數據
  const stats = {
    totalCalls: MOCK_CALL_HISTORY.length,
    connectedRate: Math.round((MOCK_CALL_HISTORY.filter(h => h.result !== 'missed' && h.result !== 'invalid' && h.result !== 'closed').length / MOCK_CALL_HISTORY.length) * 100),
    agreedRate: Math.round((MOCK_CALL_HISTORY.filter(h => h.result === 'agreed').length / MOCK_CALL_HISTORY.length) * 100),
    todayCount: MOCK_CALL_HISTORY.filter(h => h.time.includes('今天')).length,
  };

  const handleOpenDetail = (record: typeof MOCK_CALL_HISTORY[0]) => {
    setSelectedRecord(record);
    setShowDetailDialog(true);
  };

  return (
    <Layout role="staff">
      <PageHeader
        title={`個人工作紀錄 - ${staffName}`}
        subtitle={`負責區域: ${assignedAreas.join('、')} — 查看撥打歷史與績效數據`}
      />

      <div className="p-6 space-y-6">
        {/* 績效看板 - 四大數據卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-blue-600 font-medium mb-1">本月撥打通數</div>
                <div className="text-3xl font-bold text-blue-900">{stats.totalCalls}</div>
              </div>
              <Phone size={24} className="text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-green-600 font-medium mb-1">接通率</div>
                <div className="text-3xl font-bold text-green-900">{stats.connectedRate}%</div>
              </div>
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-purple-600 font-medium mb-1">答應率</div>
                <div className="text-3xl font-bold text-purple-900">{Math.round((MOCK_CALL_HISTORY.filter(h => h.result === 'agreed').length / stats.totalCalls) * 100)}%</div>
              </div>
              <CheckCircle size={24} className="text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-orange-600 font-medium mb-1">今日撥打</div>
                <div className="text-3xl font-bold text-orange-900">{stats.todayCount}</div>
              </div>
              <Phone size={24} className="text-orange-400" />
            </div>
          </div>
        </div>

        {/* 搜尋 */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋民宿名稱、地區或電話..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* 已完成撥打歷史清單 */}
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">撥號紀錄</span>
            <Badge variant="secondary" className="text-xs">{filtered.length} 筆</Badge>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(record => {
              const isExpanded = expandedId === record.id;
              const resultCfg = CALL_RESULT_CONFIG[record.result];

              return (
                <div key={record.id}>
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer'
                  )}>
                    {/* 通話結果圖標 */}
                    <div className="flex-shrink-0">
                      {RESULT_ICONS[record.result]}
                    </div>

                    {/* 民宿資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{record.name}</span>
                        <span className="text-xs text-muted-foreground">{record.area}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{record.phone}</div>
                    </div>

                    {/* 結果與時間 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', resultCfg.color)}>
                        {resultCfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{record.time}</span>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* 查看詳情按鈕 */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleOpenDetail(record)}
                    >
                      詳情
                    </Button>
                  </div>

                  {/* 展開備注 */}
                  {isExpanded && (record.note || record.lineId) && (
                    <div className="px-4 py-2 bg-muted/20 border-t border-border space-y-2">
                      {record.lineId && (
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-muted-foreground font-medium">LINE ID</div>
                            <div className="text-foreground">{record.lineId}</div>
                          </div>
                        </div>
                      )}
                      {record.note && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-muted-foreground font-medium">備注</div>
                            <div className="text-foreground">{record.note}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 分頁或加載更多 */}
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">上一頁</Button>
            <span className="text-xs text-muted-foreground">第 1 頁 / 共 3 頁</span>
            <Button variant="outline" size="sm" className="text-xs">下一頁</Button>
          </div>
        </div>
      </div>

      {/* 詳情對話框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              撥打詳情 — {selectedRecord?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* 民宿資訊 */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>📍 {selectedRecord.area}</div>
                  <div>📞 {selectedRecord.phone}</div>
                  <div>⏰ {selectedRecord.time}</div>
                  <div>✓ {CALL_RESULT_CONFIG[selectedRecord.result].label}</div>
                </div>
              </div>

              {/* LINE ID */}
              {selectedRecord.lineId && (
                <div>
                  <div className="text-sm font-medium text-foreground mb-1.5">💬 LINE ID</div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-sm text-green-700 font-mono">
                    {selectedRecord.lineId}
                  </div>
                </div>
              )}

              {/* 備注 */}
              {selectedRecord.note && (
                <div>
                  <div className="text-sm font-medium text-foreground mb-1.5">📝 備注</div>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm text-foreground">
                    {selectedRecord.note}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                  關閉
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

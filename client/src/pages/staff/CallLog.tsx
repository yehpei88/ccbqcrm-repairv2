// CC 代客烤肉 CRM 系統 — 顧客開發人員撥號登錄頁面
// 設計：電話開發記錄，5 種回饋狀態，直覺操作

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, CALL_RESULT_CONFIG, PIN_STATUS_CONFIG, type Minsu, type CallResult } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Phone, Search, CheckCircle, Clock, XCircle,
  PhoneOff, Store, ChevronDown, ChevronUp, Star,
  MessageSquare, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RESULT_ICONS: Record<CallResult, React.ReactNode> = {
  'agreed': <CheckCircle size={16} className="text-green-500" />,
  'hesitating': <Clock size={16} className="text-yellow-500" />,
  'rejected': <XCircle size={16} className="text-red-500" />,
  'invalid': <PhoneOff size={16} className="text-gray-400" />,
  'closed': <Store size={16} className="text-gray-400" />,
  'missed': <PhoneOff size={16} className="text-gray-500" />,
};

// 今日待撥清單：優先紅星，其次紅標（只限於分配的區域）
const getTodayList = (assignedAreas: string[]) => {
  return MOCK_MINSU_DATA
    .filter(m => (m.pinStatus === 'red-star' || m.pinStatus === 'red') && assignedAreas.includes(m.area))
    .sort((a, b) => {
      if (a.pinStatus === 'red-star' && b.pinStatus !== 'red-star') return -1;
      if (b.pinStatus === 'red-star' && a.pinStatus !== 'red-star') return 1;
      return b.aiScore - a.aiScore;
    });
};

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
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callResult, setCallResult] = useState<CallResult | null>(null);
  const [note, setNote] = useState('');
  const [lineId, setLineId] = useState('');
  const [callHistory, setCallHistory] = useState<Record<string, { result: CallResult; note: string; time: string; lineId?: string }>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const TODAY_LIST = getTodayList(assignedAreas);

  const filtered = TODAY_LIST.filter(m =>
    !search || m.name.includes(search) || m.area.includes(search) || m.phone.includes(search)
  );

  const handleOpenCall = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    setCallResult(callHistory[minsu.id]?.result ?? null);
    setNote(callHistory[minsu.id]?.note ?? '');
    setLineId(callHistory[minsu.id]?.lineId ?? '');
    setShowCallDialog(true);
  };

  const handleSaveCall = () => {
    if (!callResult) {
      toast.error('請選擇通話結果');
      return;
    }
    if (callResult === 'agreed' && !lineId.trim()) {
      toast.error('請輸入 LINE ID');
      return;
    }
    if (selectedMinsu) {
      const now = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      setCallHistory(prev => ({
        ...prev,
        [selectedMinsu.id]: { result: callResult, note, time: now, lineId: callResult === 'agreed' ? lineId : undefined }
      }));
      toast.success(`已登錄「${selectedMinsu.name}」的通話結果：${CALL_RESULT_CONFIG[callResult].label}`);
      if (callResult === 'agreed') {
        toast.success('🎉 已觸發自動化流程：LINE 邀請 + 菜單已自動發送！', { duration: 4000 });
      }
      setShowCallDialog(false);
      setLineId('');
    }
  };

  const todayStats = {
    total: Object.keys(callHistory).length,
    agreed: Object.values(callHistory).filter(h => h.result === 'agreed').length,
    hesitating: Object.values(callHistory).filter(h => h.result === 'hesitating').length,
    rejected: Object.values(callHistory).filter(h => h.result === 'rejected').length,
    invalid: Object.values(callHistory).filter(h => h.result === 'invalid' || h.result === 'closed').length,
  };

  return (
    <Layout role="staff">
      <PageHeader
        title={`撥號登錄 - ${staffName}`}
        subtitle={`今日電話開發清單 (負責區域: ${assignedAreas.join('、')}) — 登錄通話結果`}
        actions={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">今日進度：</span>
            <span className="font-bold text-foreground">{todayStats.total}</span>
            <span className="text-muted-foreground">/ {TODAY_LIST.length} 家</span>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {/* 今日統計 */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: '已撥打', value: todayStats.total, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: '✅ 答應加賴', value: todayStats.agreed, color: 'bg-green-50 text-green-700 border-green-100' },
            { label: '⏳ 猶豫中', value: todayStats.hesitating, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            { label: '❌ 拒絕', value: todayStats.rejected, color: 'bg-red-50 text-red-700 border-red-100' },
            { label: '📵 空號/不營業', value: todayStats.invalid, color: 'bg-gray-50 text-gray-600 border-gray-100' },
          ].map(item => (
            <div key={item.label} className={cn('rounded-xl p-3 border text-center', item.color)}>
              <div className="text-xl font-black">{item.value}</div>
              <div className="text-xs mt-0.5">{item.label}</div>
            </div>
          ))}
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

        {/* 撥號清單 */}
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">今日待撥清單</span>
            <Badge variant="secondary" className="text-xs">{filtered.length} 家</Badge>
            <span className="text-xs text-muted-foreground ml-1">（AI 評分高者優先）</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(minsu => {
              const history = callHistory[minsu.id];
              const pinCfg = PIN_STATUS_CONFIG[minsu.pinStatus];
              const isExpanded = expandedId === minsu.id;

              return (
                <div key={minsu.id}>
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors',
                    history && 'bg-muted/10'
                  )}>
                    {/* 序號 + Pin 狀態 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {minsu.pinStatus === 'red-star' && (
                        <Star size={12} className="text-red-500" fill="currentColor" />
                      )}
                      <div className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        pinCfg.bgLight, pinCfg.textColor, 'border', pinCfg.border
                      )}>
                        {pinCfg.label}
                      </div>
                    </div>

                    {/* 民宿資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{minsu.name}</span>
                        <span className="text-xs text-muted-foreground">{minsu.area}</span>
                        <span className="text-xs text-blue-600 font-medium">AI {minsu.aiScore}分</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{minsu.phone}</div>
                    </div>

                    {/* 通話結果 */}
                    {history && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', CALL_RESULT_CONFIG[history.result].color)}>
                          {CALL_RESULT_CONFIG[history.result].label}
                        </span>
                        <span className="text-xs text-muted-foreground">{history.time}</span>
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setExpandedId(isExpanded ? null : minsu.id)}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs gap-1"
                        style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                        onClick={() => handleOpenCall(minsu)}
                      >
                        <Phone size={11} />
                        {history ? '更新' : '撥打'}
                      </Button>
                    </div>
                  </div>

                  {/* 展開備注 */}
                  {isExpanded && history?.note && (
                    <div className="px-4 py-2 bg-muted/20 border-t border-border">
                      <div className="flex items-start gap-2 text-sm">
                        <FileText size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{history.note}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 撥號登錄 Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              登錄通話結果 — {selectedMinsu?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMinsu && (
            <div className="space-y-4">
              {/* 民宿資訊 */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>📍 {selectedMinsu.area}</div>
                  <div>📞 {selectedMinsu.phone}</div>
                  <div>🎯 AI 評分：{selectedMinsu.aiScore}/50</div>
                  <div>🏠 {selectedMinsu.isPackage ? '包棟' : '一般'} · {selectedMinsu.hasRainShelter ? '有雨棚' : '無雨棚'}</div>
                </div>
              </div>

              {/* 通話結果選擇 */}
              <div>
                <div className="text-sm font-semibold text-foreground mb-3">通話結果 *</div>
                <div className="space-y-2">
                  {(Object.keys(CALL_RESULT_CONFIG) as CallResult[]).map(result => (
                    <CallResultButton
                      key={result}
                      result={result}
                      selected={callResult === result}
                      onClick={() => setCallResult(result)}
                    />
                  ))}
                </div>
              </div>

              {/* 自動化說明 */}
              {callResult === 'agreed' && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-sm text-green-700">
                  <div className="font-semibold mb-1">🎉 自動化流程將觸發</div>
                  <div className="text-xs space-y-0.5">
                    <div>✓ 自動發送 LINE 好友邀請</div>
                    <div>✓ 自動推送歡迎訊息與數位菜單</div>
                    <div>✓ 進入 AI 意向追蹤流程</div>
                  </div>
                </div>
              )}

              {/* LINE ID 輸入 */}
              {callResult === 'agreed' && (
                <div>
                  <div className="text-sm font-medium text-foreground mb-1.5">💬 輸入 LINE ID *</div>
                  <Input
                    placeholder="請輸入對方的 LINE ID"
                    className="text-sm"
                    value={lineId}
                    onChange={e => setLineId(e.target.value)}
                  />
                </div>
              )}

              {/* 備注 */}
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5">備注（選填）</div>
                <Textarea
                  placeholder="輸入通話備注，例如：對方說下週再聯絡、老闆不在..."
                  className="text-sm resize-none"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCallDialog(false)}>取消</Button>
            <Button size="sm" onClick={handleSaveCall} disabled={!callResult}>
              確認登錄
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

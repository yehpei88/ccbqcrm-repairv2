// 設計：民宿詳細資訊查看與備注輸入，顧客開發人員作業介面

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, CALL_RESULT_CONFIG, INTENT_CONFIG, classifyIntent, type Minsu, type PinStatus, type CallSummary } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, FileText, Phone, MapPin, Home, Umbrella,
  Star, TrendingUp, MessageSquare, Save, ChevronRight,
  Building2, Clock, Mic, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PIN_COLORS: Record<PinStatus, string> = {
  'red-star': '#ef4444',
  'red': '#f87171',
  'green': '#22c55e',
  'purple': '#a855f7',
  'gold': '#eab308',
};

export default function CustomerDetail() {
  const [search, setSearch] = useState('');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(MOCK_MINSU_DATA[0]);
  const [note, setNote] = useState(MOCK_MINSU_DATA[0]?.note ?? '');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [callSummaries, setCallSummaries] = useState<Record<string, CallSummary[]>>({});
  const [summaryInput, setSummaryInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const areas = ['all', ...Array.from(new Set(MOCK_MINSU_DATA.map(m => m.area)))];

  const filtered = MOCK_MINSU_DATA.filter(m => {
    if (filterArea !== 'all' && m.area !== filterArea) return false;
    if (search && !m.name.includes(search) && !m.phone.includes(search)) return false;
    return true;
  });

  const handleSelect = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    setNote(minsu.note ?? '');
  };

  const handleSaveNote = () => {
    toast.success(`已儲存「${selectedMinsu?.name}」的備注`);
  };

  const handleAddCallSummary = () => {
    if (!summaryInput.trim() || !selectedMinsu) {
      toast.error('請輸入通話摘要');
      return;
    }

    const intentLabel = classifyIntent(summaryInput);
    const newSummary: CallSummary = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-TW'),
      summary: summaryInput,
      intentLabel,
      source: 'manual',
    };

    const minsuId = selectedMinsu.id;
    setCallSummaries(prev => ({
      ...prev,
      [minsuId]: [...(prev[minsuId] || []), newSummary],
    }));

    toast.success(`已新增通話摘要，意向分類：${INTENT_CONFIG[intentLabel].label}`);
    setSummaryInput('');
    setIsDialogOpen(false);
  };

  const handleDeleteSummary = (minsuId: string, summaryId: string) => {
    setCallSummaries(prev => ({
      ...prev,
      [minsuId]: prev[minsuId].filter(s => s.id !== summaryId),
    }));
    toast.success('已刪除通話摘要');
  };

  const minsuSummaries = selectedMinsu ? (callSummaries[selectedMinsu.id] || []) : [];

  return (
    <Layout role="staff">
      <PageHeader
        title="客戶備注"
        subtitle="查看民宿詳細資訊並輸入備注"
      />

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左側清單 */}
        <div className="w-72 border-r border-border bg-white flex flex-col">
          {/* 搜尋 */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜尋民宿或電話..."
                className="pl-8 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* 地區篩選 */}
            <div className="flex gap-1 flex-wrap">
              {areas.map(area => (
                <button
                  key={area}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border transition-colors',
                    filterArea === area
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                  onClick={() => setFilterArea(area)}
                >
                  {area === 'all' ? '全部' : area}
                </button>
              ))}
            </div>
          </div>

          {/* 清單 */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(minsu => {
              const pinCfg = PIN_STATUS_CONFIG[minsu.pinStatus];
              return (
                <div
                  key={minsu.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50',
                    selectedMinsu?.id === minsu.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-muted/30'
                  )}
                  onClick={() => handleSelect(minsu)}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PIN_COLORS[minsu.pinStatus] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{minsu.name}</div>
                    <div className="text-xs text-muted-foreground">{minsu.area}</div>
                  </div>
                  {(minsu.note || callSummaries[minsu.id]?.length) && (
                    <FileText size={11} className="text-blue-400 flex-shrink-0" />
                  )}
                  <ChevronRight size={11} className="text-muted-foreground flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側詳情 */}
        {selectedMinsu ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl space-y-5">
              {/* 標題卡 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-foreground">{selectedMinsu.name}</h2>
                      {selectedMinsu.pinStatus === 'red-star' && (
                        <Star size={16} className="text-red-500" fill="currentColor" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        PIN_STATUS_CONFIG[selectedMinsu.pinStatus].bgLight,
                        PIN_STATUS_CONFIG[selectedMinsu.pinStatus].textColor,
                        'border',
                        PIN_STATUS_CONFIG[selectedMinsu.pinStatus].border,
                      )}>
                        {PIN_STATUS_CONFIG[selectedMinsu.pinStatus].label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        AI 評分：<span className="font-semibold text-foreground">{selectedMinsu.aiScore}/50</span>
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                    onClick={() => toast.success(`撥打 ${selectedMinsu.phone}`)}
                  >
                    <Phone size={13} />
                    撥打電話
                  </Button>
                </div>
              </div>

              {/* 基本資料 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 size={14} />
                  基本資料
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { icon: <MapPin size={13} />, label: '地址', value: selectedMinsu.address },
                    { icon: <Phone size={13} />, label: '電話', value: selectedMinsu.phone },
                    { icon: <MapPin size={13} />, label: '地區', value: selectedMinsu.area },
                    { icon: <Home size={13} />, label: '類型', value: selectedMinsu.isPackage ? '包棟民宿' : '一般民宿' },
                    { icon: <Umbrella size={13} />, label: '雨棚', value: selectedMinsu.hasRainShelter ? '有雨棚設施' : '無雨棚' },
                    { icon: <MapPin size={13} />, label: '距市區', value: `約 ${selectedMinsu.distanceFromCity} 公里` },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-2">
                      <div className="text-muted-foreground mt-0.5 flex-shrink-0">{item.icon}</div>
                      <div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                        <div className="font-medium text-foreground">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 開發狀態 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={14} />
                  開發狀態
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">通話結果</div>
                    {selectedMinsu.callResult ? (
                      <span className={cn('text-xs px-2 py-1 rounded-full', CALL_RESULT_CONFIG[selectedMinsu.callResult].color)}>
                        {CALL_RESULT_CONFIG[selectedMinsu.callResult].label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">尚未撥打</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">AI 意向</div>
                    {selectedMinsu.intentLabel ? (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', INTENT_CONFIG[selectedMinsu.intentLabel].color)}>
                        {INTENT_CONFIG[selectedMinsu.intentLabel].label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">尚無資料</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">LINE 狀態</div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      selectedMinsu.lineAdded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {selectedMinsu.lineAdded ? '✅ 已加入' : '未加入'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">合作次數</div>
                    <span className="font-semibold text-foreground">{selectedMinsu.cooperationCount} 次</span>
                  </div>
                </div>
              </div>

              {/* AI 評分詳情 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star size={14} />
                  AI 潛力評分
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">總分</span>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${(selectedMinsu.aiScore / 50) * 100}%`,
                          background: selectedMinsu.aiScore >= 20 ? 'oklch(0.65 0.22 25)' : 'oklch(0.55 0.18 250)'
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-12 text-right">
                      {selectedMinsu.aiScore}/50
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedMinsu.aiScore >= 20
                      ? '✅ 達到紅星門檻（≥ 20 分），建議優先開發'
                      : '⚠️ 未達紅星門檻（< 20 分），列為紅標備選'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: '包棟', value: selectedMinsu.isPackage, score: '+5' },
                      { label: '有雨棚', value: selectedMinsu.hasRainShelter, score: '+3' },
                      { label: '距市區遠', value: selectedMinsu.distanceFromCity > 15, score: '+2' },
                    ].map(item => (
                      <div key={item.label} className={cn(
                        'text-xs p-2 rounded-lg text-center border',
                        item.value ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'
                      )}>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs">{item.value ? item.score : '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 備注輸入 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare size={14} />
                  工作備注
                </h3>
                <Textarea
                  placeholder="輸入備注，例如：老闆說 6 月有包棟活動、對方要求再聯絡、有興趣但需要確認場地..."
                  className="text-sm resize-none mb-3"
                  rows={4}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSaveNote}
                >
                  <Save size={13} />
                  儲存備注
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">請從左側選擇民宿</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

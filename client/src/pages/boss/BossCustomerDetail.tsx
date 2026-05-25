
import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, type Minsu, type PinStatus } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search, Phone, MapPin, Home, Umbrella,
  Star, TrendingUp, MessageSquare, Save, ChevronRight,
  Building2, Clock, Trash2, User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PIN_COLORS: Record<PinStatus, string> = {
  'red-star': '#ef4444',
  'red': '#f87171',
  'green': '#22c55e',
  'purple': '#a855f7',
  'gold': '#eab308',
};

// 模擬顧客開發人員分配
const STAFF_NAMES = ['小陳', '小林', '小王'];

export default function BossCustomerDetail() {
  const [search, setSearch] = useState('');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(MOCK_MINSU_DATA[0]);
  const [note, setNote] = useState(MOCK_MINSU_DATA[0]?.note ?? '');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [minsuStaffMap, setMinsuStaffMap] = useState<Record<string, string>>({
    '1': '小陳', '2': '小王', '3': '小陳', '4': '小林', '5': '小林',
    '6': '小王', '7': '小陳', '8': '小林', '9': '小王', '10': '小陳'
  });
  const [missedCalls, setMissedCalls] = useState<Record<string, { date: string; remindDays: number; phoneStatus: 'pending' | 'confirmed' }>>({});

  const areas = ['all', ...Array.from(new Set(MOCK_MINSU_DATA.map(m => m.area)))];

  const filtered = MOCK_MINSU_DATA.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
    const matchArea = filterArea === 'all' || m.area === filterArea;
    const matchStaff = filterStaff === 'all' || minsuStaffMap[m.id] === filterStaff;
    return matchSearch && matchArea && matchStaff;
  });

  const handleSelect = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    setNote(minsu.note || '');
  };

  const handleSaveNote = () => {
    toast.success(`已儲存「${selectedMinsu?.name}」的備注`);
  };

  const staffName = selectedMinsu ? minsuStaffMap[selectedMinsu.id] : '';

  return (
    <Layout role="boss">
      <PageHeader
        title="客戶備註管理"
        subtitle="查看所有民宿詳細資訊、未接電話管理"
      />

      <div className="flex h-[calc(100vh-200px)] gap-4 p-6">
        {/* 左側清單 */}
        <div className="w-80 flex flex-col gap-3 border border-border rounded-xl bg-white overflow-hidden shadow-sm">
          {/* 搜尋和篩選 */}
          <div className="p-4 space-y-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="搜尋民宿名稱或電話..."
                className="pl-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* 地區篩選 */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">地區</div>
              <div className="flex flex-wrap gap-1.5">
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

            {/* 顧客開發人員篩選 */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">顧客開發人員</div>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...STAFF_NAMES].map(staff => (
                  <button
                    key={staff}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border transition-colors',
                      filterStaff === staff
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    )}
                    onClick={() => setFilterStaff(staff)}
                  >
                    {staff === 'all' ? '全部' : staff}
                  </button>
                ))}
              </div>
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
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <User size={10} />
                      {minsuStaffMap[minsu.id]}
                    </div>
                  </div>
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
                    <div className="flex items-center gap-2 flex-wrap mb-2">
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      <span>負責人：<span className="font-semibold text-foreground">{staffName}</span></span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
                    onClick={() => toast.success(`撨打 ${selectedMinsu.phone}`)}
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
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone size={14} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">電話</div>
                      <div className="font-medium text-foreground">{selectedMinsu.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">地區</div>
                      <div className="font-medium text-foreground">{selectedMinsu.area}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home size={14} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">房間數</div>
                      <div className="font-medium text-foreground">{selectedMinsu.rooms} 間</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Umbrella size={14} className="text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">客戶類型</div>
                      <div className="font-medium text-foreground">{selectedMinsu.customerType}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LINE 狀態 */}
              <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageSquare size={14} />
                  LINE 狀態
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">已加入 LINE</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedMinsu.lineAdded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {selectedMinsu.lineAdded ? '✅ 已加入' : '未加入'}
                  </span>
                </div>
              </div>

              {/* 未接電話管理 */}
              {missedCalls[selectedMinsu.id] && (
                <div className="bg-white rounded-xl border border-border p-5 shadow-sm border-l-4 border-l-gray-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="text-lg">📴</span>
                      未接電話管理
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">未接日期</div>
                        <div className="font-medium text-foreground">{missedCalls[selectedMinsu.id].date}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">電話狀態</div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          missedCalls[selectedMinsu.id].phoneStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        )}>
                          {missedCalls[selectedMinsu.id].phoneStatus === 'pending' ? '【待確認】' : '【已確認】'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">提醒天數</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{missedCalls[selectedMinsu.id].remindDays} 天</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={missedCalls[selectedMinsu.id].remindDays}
                            onChange={(e) => setMissedCalls(prev => ({
                              ...prev,
                              [selectedMinsu.id]: {
                                ...prev[selectedMinsu.id],
                                remindDays: parseInt(e.target.value) || 7
                              }
                            }))}
                            className="w-12 px-2 py-1 text-xs border border-border rounded"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">修改狀態</div>
                        <select
                          value={missedCalls[selectedMinsu.id].phoneStatus}
                          onChange={(e) => setMissedCalls(prev => ({
                            ...prev,
                            [selectedMinsu.id]: {
                              ...prev[selectedMinsu.id],
                              phoneStatus: e.target.value as 'pending' | 'confirmed'
                            }
                          }))}
                          className="text-xs px-2 py-1 border border-border rounded bg-white"
                        >
                          <option value="pending">待確認</option>
                          <option value="confirmed">已確認</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => {
                        setMissedCalls(prev => {
                          const newMissed = { ...prev };
                          delete newMissed[selectedMinsu.id];
                          return newMissed;
                        });
                        toast.success('已移除未接電話記錄');
                      }}
                    >
                      <Trash2 size={13} />
                      移除記錄
                    </Button>
                  </div>
                </div>
              )}



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
                  style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
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
              <p className="text-sm">選擇一個民宿查看詳細資訊</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

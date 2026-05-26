// CC 代客烤肉 CRM 系統 — 老闆 VIP 管理頁面
// 設計：現代企業 CRM，金色 VIP 標示，RFM 分析卡片，差異化行銷功能

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, PIN_STATUS_CONFIG, INTENT_CONFIG, type Minsu } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { FollowUpDialog } from '@/components/FollowUpDialog';
import { toast } from 'sonner';
import {
  Star, Crown, TrendingUp, MessageSquare, Mail, Phone,
  Search, Filter, ChevronDown, ChevronUp, Eye,
  Award, Clock, DollarSign, BarChart2, Send, Phone as PhoneIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// VIP 客戶：合作 ≥ 3 次（金標）或合作 1-3 次（紫標）
const VIP_DATA = MOCK_MINSU_DATA.filter(m => m.pinStatus === 'gold' || m.pinStatus === 'purple');

function getRfmClass(r: number, f: number, m: number) {
  if (f >= 4 && r <= 30) return { label: '🏆 Champions', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  if (f >= 3 && r <= 60) return { label: '💎 Loyal', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (f >= 2 && r <= 90) return { label: '📈 Potential', color: 'bg-green-100 text-green-800 border-green-200' };
  if (r > 90) return { label: '😴 At Risk', color: 'bg-red-100 text-red-700 border-red-200' };
  return { label: '🔍 Needs Attention', color: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function RfmBadge({ r, f, m }: { r: number; f: number; m: number }) {
  const cls = getRfmClass(r, f, m);
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', cls.color)}>
      {cls.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function VipManagement() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('revenue');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);
  const [marketingTarget, setMarketingTarget] = useState<Minsu | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState<Minsu | null>(null);

  const filtered = VIP_DATA
    .filter(m => {
      if (filterStatus !== 'all' && m.pinStatus !== filterStatus) return false;
      if (search && !m.name.includes(search) && !m.area.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'frequency') return b.cooperationCount - a.cooperationCount;
      if (sortBy === 'recency') return (a.rfmR ?? 999) - (b.rfmR ?? 999);
      return 0;
    });

  const totalRevenue = VIP_DATA.reduce((s, m) => s + m.totalRevenue, 0);
  const goldCount = VIP_DATA.filter(m => m.pinStatus === 'gold').length;
  const purpleCount = VIP_DATA.filter(m => m.pinStatus === 'purple').length;
  const avgFreq = (VIP_DATA.reduce((s, m) => s + m.cooperationCount, 0) / VIP_DATA.length).toFixed(1);

  return (
    <Layout role="boss">
      <PageHeader
        title="VIP 管理"
        subtitle="合作客戶 RFM 分析與差異化行銷管理"
        actions={
          <Button
            size="sm"
            className="gap-2"
            style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
            onClick={() => toast.info('批次行銷功能開發中')}
          >
            <Send size={14} />
            批次發送優惠
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Crown size={18} className="text-yellow-600" />}
            label="金燈 VIP 客戶"
            value={`${goldCount} 家`}
            sub="合作 ≥ 3 次"
            color="bg-yellow-50"
          />
          <StatCard
            icon={<Star size={18} className="text-purple-600" />}
            label="紫燈合作客戶"
            value={`${purpleCount} 家`}
            sub="合作 1-3 次"
            color="bg-purple-50"
          />
          <StatCard
            icon={<DollarSign size={18} className="text-green-600" />}
            label="VIP 累計營收"
            value={`$${totalRevenue.toLocaleString()}`}
            sub="歷史合作總金額"
            color="bg-green-50"
          />
          <StatCard
            icon={<BarChart2 size={18} className="text-blue-600" />}
            label="平均合作頻率"
            value={`${avgFreq} 次`}
            sub="每家平均合作次數"
            color="bg-blue-50"
          />
        </div>

        {/* RFM 說明 */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-foreground">RFM 分析說明</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={12} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-foreground">R — Recency（近期性）</div>
                <div className="text-muted-foreground text-xs mt-0.5">距離上次合作的天數，數值越小越好</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart2 size={12} className="text-green-600" />
              </div>
              <div>
                <div className="font-medium text-foreground">F — Frequency（頻率）</div>
                <div className="text-muted-foreground text-xs mt-0.5">合作頻率，≥ 3 次升為金燈 VIP</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <DollarSign size={12} className="text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-foreground">M — Monetary（金額）</div>
                <div className="text-muted-foreground text-xs mt-0.5">歷史消費金額貢獻度</div>
              </div>
            </div>
          </div>
        </div>

        {/* 篩選列 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋民宿名稱或地區..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <Filter size={13} className="mr-1" />
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部客戶</SelectItem>
              <SelectItem value="gold">🟡 金燈 VIP</SelectItem>
              <SelectItem value="purple">🟣 紫燈合作</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">依營收排序</SelectItem>
              <SelectItem value="frequency">依頻率排序</SelectItem>
              <SelectItem value="recency">依近期性排序</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">共 {filtered.length} 筆</span>
        </div>

        {/* VIP 資料表 */}
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">民宿名稱</th>
                <th className="text-left">地區</th>
                <th className="text-left">狀態</th>
                <th className="text-left">RFM 分類</th>
                <th className="text-right">R（天）</th>
                <th className="text-right">F（次）</th>
                <th className="text-right">M（元）</th>
                <th className="text-left">AI 意向</th>
                <th className="text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(minsu => {
                const pinCfg = PIN_STATUS_CONFIG[minsu.pinStatus];
                const intentCfg = minsu.intentLabel ? INTENT_CONFIG[minsu.intentLabel] : null;
                const isExpanded = expandedRow === minsu.id;
                return (
                  <>
                    <tr key={minsu.id} className="hover:bg-muted/30 transition-colors">
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setExpandedRow(isExpanded ? null : minsu.id)}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <div>
                            <div className="font-medium text-foreground text-sm">{minsu.name}</div>
                            <div className="text-xs text-muted-foreground">{minsu.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{minsu.area}</td>
                      <td>
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          pinCfg.bgLight, pinCfg.textColor, 'border', pinCfg.border
                        )}>
                          {pinCfg.label}
                        </span>
                      </td>
                      <td>
                        <RfmBadge r={minsu.rfmR ?? 0} f={minsu.rfmF ?? 0} m={minsu.rfmM ?? 0} />
                      </td>
                      <td className="text-right text-sm font-mono">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs',
                          (minsu.rfmR ?? 0) <= 30 ? 'bg-green-100 text-green-700' :
                            (minsu.rfmR ?? 0) <= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                        )}>
                          {minsu.rfmR ?? '-'}
                        </span>
                      </td>
                      <td className="text-right text-sm font-semibold text-foreground">{minsu.rfmF ?? 0}</td>
                      <td className="text-right text-sm font-semibold text-foreground">
                        ${(minsu.rfmM ?? 0).toLocaleString()}
                      </td>
                      <td>
                        {intentCfg ? (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border', intentCfg.color)}>
                            {intentCfg.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => { setSelectedMinsu(minsu); setShowDetail(true); }}
                          >
                            <Eye size={12} className="mr-1" />
                            詳情
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => { setFollowUpTarget(minsu); setShowFollowUp(true); }}
                          >
                            <PhoneIcon size={12} className="mr-1" />
                            主動回訪
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => { setMarketingTarget(minsu); setShowMarketing(true); }}
                          >
                            <Send size={12} className="mr-1" />
                            行銷
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${minsu.id}-expand`}>
                        <td colSpan={9} className="bg-muted/20 px-6 py-4">
                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                              <div className="font-semibold text-foreground mb-2">基本資料</div>
                              <div className="space-y-1 text-muted-foreground">
                                <div>📍 {minsu.address}</div>
                                <div>📞 {minsu.phone}</div>
                                <div>🏠 {minsu.isPackage ? '包棟民宿' : '一般民宿'}</div>
                                <div>☂️ {minsu.hasRainShelter ? '有雨棚設施' : '無雨棚'}</div>
                                <div>📏 距市區約 {minsu.distanceFromCity} 公里</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-foreground mb-2">合作記錄</div>
                              <div className="space-y-1 text-muted-foreground">
                                <div>🤝 合作次數：{minsu.cooperationCount} 次</div>
                                <div>📅 最後合作：{minsu.lastCoopDate ?? '尚無記錄'}</div>
                                <div>💰 累計金額：${minsu.totalRevenue.toLocaleString()}</div>
                                <div>🔗 LINE：{minsu.lineAdded ? '已加入' : '未加入'}</div>
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-foreground mb-2">AI 評分</div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">潛力分數</span>
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full"
                                      style={{
                                        width: `${(minsu.aiScore / 50) * 100}%`,
                                        background: minsu.aiScore >= 20 ? 'oklch(0.65 0.22 25)' : 'oklch(0.55 0.18 250)'
                                      }}
                                    />
                                  </div>
                                  <span className="font-bold text-foreground">{minsu.aiScore}/50</span>
                                </div>
                                {minsu.note && <div className="text-muted-foreground">📝 {minsu.note}</div>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 詳情 Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown size={18} className="text-yellow-500" />
              {selectedMinsu?.name} — VIP 詳情
            </DialogTitle>
          </DialogHeader>
          {selectedMinsu && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-100">
                  <div className="text-2xl font-black text-yellow-700">{selectedMinsu.cooperationCount}</div>
                  <div className="text-xs text-yellow-600 mt-0.5">合作次數</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                  <div className="text-2xl font-black text-green-700">${selectedMinsu.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-0.5">累計營收</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">地址</span>
                  <span className="font-medium">{selectedMinsu.address}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">電話</span>
                  <span className="font-medium">{selectedMinsu.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">最後合作</span>
                  <span className="font-medium">{selectedMinsu.lastCoopDate ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">RFM 分類</span>
                  <RfmBadge r={selectedMinsu.rfmR ?? 0} f={selectedMinsu.rfmF ?? 0} m={selectedMinsu.rfmM ?? 0} />
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">設施</span>
                  <span className="font-medium">
                    {[selectedMinsu.isPackage && '包棟', selectedMinsu.hasRainShelter && '有雨棚'].filter(Boolean).join('・') || '一般'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1 gap-1" variant="outline"
                  onClick={() => toast.success(`已撥打 ${selectedMinsu.phone}`)}>
                  <Phone size={13} /> 撥打電話
                </Button>
                <Button size="sm" className="flex-1 gap-1" variant="outline"
                  onClick={() => toast.success('已發送 LINE 訊息')}>
                  <MessageSquare size={13} /> 發送 LINE
                </Button>
                <Button size="sm" className="flex-1 gap-1" variant="outline"
                  onClick={() => toast.success('已發送 Gmail')}>
                  <Mail size={13} /> 發送 Gmail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 一鍵回訪 Dialog */}
      <FollowUpDialog
        open={showFollowUp}
        minsu={followUpTarget}
        onOpenChange={setShowFollowUp}
        onSend={(template) => {
          toast.success(`已使用「${template.name}」範本發送回訪訊息`);
        }}
      />

      {/* 行銷 Dialog */}
      <Dialog open={showMarketing} onOpenChange={setShowMarketing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award size={18} className="text-orange-500" />
              差異化行銷 — {marketingTarget?.name}
            </DialogTitle>
          </DialogHeader>
          {marketingTarget && (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-sm text-orange-700">
                <div className="font-semibold mb-1">AI 行銷建議</div>
                <div>
                  {marketingTarget.pinStatus === 'gold'
                    ? `此客戶為 VIP 金燈，合作 ${marketingTarget.cooperationCount} 次，建議提供專屬 9 折優惠或節慶禮遇，強化長期合作關係。`
                    : `此客戶合作 ${marketingTarget.cooperationCount} 次，距離升等 VIP 僅差 ${3 - marketingTarget.cooperationCount} 次，建議推送升等優惠促進再次合作。`
                  }
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">選擇行銷方式</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <MessageSquare size={16} />, label: 'LINE 訊息' },
                    { icon: <Mail size={16} />, label: 'Gmail' },
                    { icon: <Phone size={16} />, label: '電話聯繫' },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm"
                      onClick={() => {
                        toast.success(`已發送 ${opt.label} 給 ${marketingTarget.name}`);
                        setShowMarketing(false);
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMarketing(false)}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

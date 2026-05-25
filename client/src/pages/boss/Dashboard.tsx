// CC 代客烤肉 CRM 系統 — 老闆營運儀表板
// 設計：關鍵統計卡片、Pin 狀態分佈、客戶類型分佈、AI 顧客答應率對比、接受率與成交率成長

import Layout, { PageHeader } from '@/components/Layout';
import {
  MOCK_MINSU_DATA, CUSTOMER_TYPE_DATA,
  PIN_STATUS_CONFIG, ACCEPTANCE_RATE_DATA, CONVERSION_RATE_DATA
} from '@/lib/data';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, MapPin, Flame, Star, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const pinCounts = Object.entries(PIN_STATUS_CONFIG).map(([key, cfg]) => ({
  key,
  label: cfg.label,
  count: MOCK_MINSU_DATA.filter(m => m.pinStatus === key).length,
  color: cfg.textColor,
}));

const vipCount = MOCK_MINSU_DATA.filter(m => m.pinStatus === 'gold').length;
const lineAdded = MOCK_MINSU_DATA.filter(m => m.lineAdded).length;
const hotLeads = MOCK_MINSU_DATA.filter(m => m.intentLabel === 'hot').length;
const missedCalls = MOCK_MINSU_DATA.filter(m => m.missedCallDate).length;

// AI 導入前後對比
const CONVERSION_COMPARE = [
  { name: '導入前', rate: 12, color: '#94a3b8' },
  { name: '導入後', rate: 31, color: '#f97316' },
];

function StatCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-green-500" />
              <span className="text-xs text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Layout role="boss">
      <PageHeader
        title="營運儀表板"
        subtitle="CC 代客烤肉 · 宜蘭地區通路開發概覽"
      />

      <div className="p-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Star size={20} className="text-yellow-600" />}
            label="VIP 金標客戶"
            value={`${vipCount} 家`}
            sub="合作 ≥ 3 次"
            color="bg-yellow-50"
            trend="本月新增 1 家"
          />
          <StatCard
            icon={<Users size={20} className="text-blue-600" />}
            label="已加 LINE 客戶"
            value={`${lineAdded} 家`}
            sub={`佔總數 ${Math.round((lineAdded / MOCK_MINSU_DATA.length) * 100)}%`}
            color="bg-blue-50"
          />
          <StatCard
            icon={<Flame size={20} className="text-red-500" />}
            label="高熱度商機"
            value={`${hotLeads} 筆`}
            sub="需立即跟進"
            color="bg-red-50"
            trend="今日新增 2 筆"
          />
          <StatCard
            icon={<Bell size={20} className="text-gray-600" />}
            label="未接電話待重撥"
            value={`${missedCalls} 筆`}
            sub="需要重新聯繫"
            color="bg-gray-50"
            trend="今日 3 筆"
          />
        </div>

        {/* Pin 狀態分佈 + 客戶類型分佈 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Pin 狀態分佈</h3>
            <div className="space-y-3">
              {pinCounts.map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-muted-foreground shrink-0">{item.label}</div>
                  <div className="flex-1 bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${(item.count / MOCK_MINSU_DATA.length) * 100}%`,
                        background: item.key === 'red-star' ? '#ef4444' :
                          item.key === 'red' ? '#f87171' :
                            item.key === 'green' ? '#22c55e' :
                              item.key === 'purple' ? '#a855f7' : '#eab308'
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-foreground">{item.count} 家</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>總計 {MOCK_MINSU_DATA.length} 家民宿</span>
              <span>宜蘭全區</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">客戶類型分佈</h3>
              <p className="text-xs text-muted-foreground mt-0.5">民宿類型佔比</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={CUSTOMER_TYPE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {CUSTOMER_TYPE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {CUSTOMER_TYPE_DATA.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI 顧客答應率對比 */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">AI 導入效益對比</h3>
          <p className="text-xs text-muted-foreground mb-4">電話開發顧客答應率（加 LINE 成功率）</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONVERSION_COMPARE} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v}%`, '顧客答應率']} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {CONVERSION_COMPARE.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-700">
            <span className="font-semibold">AI 系統導入後</span>，顧客答應率從 12% 提升至 31%，提升幅度達 <span className="font-bold">+158%</span>
          </div>
        </div>

        {/* 客戶開發接受率成長折線圖 */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">客戶開發接受率成長</h3>
          <p className="text-xs text-muted-foreground mb-4">視覺化比較 AI 行銷導入前後的取得聯絡成功率變化</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ACCEPTANCE_RATE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v}%`, '']} />
              <Legend />
              <Line type="monotone" dataKey="before" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 3 }} name="導入前" />
              <Line type="monotone" dataKey="after" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} name="導入後" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 客戶開發成交率成長折線圖 */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-1">客戶開發成交率成長</h3>
          <p className="text-xs text-muted-foreground mb-4">視覺化比較 AI 行銷導入前後的訂單成交數變化</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={CONVERSION_RATE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="before" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 3 }} name="導入前" />
              <Line type="monotone" dataKey="after" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} name="導入後" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 最新警示 */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-red-500" />
              <h3 className="font-semibold text-foreground">最新 AI 意向警示</h3>
            </div>
            <a href="/boss/alerts" className="text-xs text-blue-600 hover:underline">查看全部</a>
          </div>
          <div className="space-y-2">
            {[
              { name: '礁溪山景民宿', msg: '詢問 6/20 檔期，意向強烈', type: 'hot', time: '10 分鐘前' },
              { name: '員山竹林小屋', msg: '明確表達預約意願', type: 'hot', time: '35 分鐘前' },
              { name: '冬山河畔民宿', msg: '已讀 3 天未回應，建議補發優惠', type: 'seen', time: '2 小時前' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  alert.type === 'hot' ? 'bg-red-500' : 'bg-yellow-500'
                )} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-foreground">{alert.name}</span>
                  <span className="text-muted-foreground text-sm"> — {alert.msg}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

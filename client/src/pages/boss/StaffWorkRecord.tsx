// CC 代客烤肉 CRM 系統 — 銷售人員作業紀錄（老闆管理介面）
// 設計：顧客開發人員卡片、撥號記錄表、今日結果分佈、整體成效

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { STAFF_RECORDS, CALL_LOGS, CALL_RESULT_CONFIG } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, CheckCircle, Phone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportStaffWorkRecord } from '@/lib/excelExport';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 計算今日結果分佈
const todayResults = CALL_LOGS.reduce((acc, log) => {
  const existing = acc.find(r => r.result === log.result);
  if (existing) {
    existing.count += 1;
  } else {
    acc.push({ result: log.result, count: 1 });
  }
  return acc;
}, [] as Array<{ result: string; count: number }>);

// 計算整體成效
const totalCalls = STAFF_RECORDS.reduce((sum, staff) => sum + staff.totalCalls, 0);
const totalSuccessful = STAFF_RECORDS.reduce((sum, staff) => sum + staff.successfulAdds, 0);
const avgConversionRate = Math.round((totalSuccessful / totalCalls) * 100);

// 結果顏色對應
const resultColors: Record<string, { bg: string; text: string; bar: string }> = {
  'agreed': { bg: '#22c55e', text: '#16a34a', bar: '#22c55e' },
  'hesitating': { bg: '#eab308', text: '#ca8a04', bar: '#eab308' },
  'rejected': { bg: '#ef4444', text: '#dc2626', bar: '#ef4444' },
  'invalid': { bg: '#9ca3af', text: '#6b7280', bar: '#9ca3af' },
  'closed': { bg: '#3b82f6', text: '#1d4ed8', bar: '#3b82f6' },
};

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StaffWorkRecord() {
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  const filtered = selectedStaff === 'all' 
    ? CALL_LOGS 
    : CALL_LOGS.filter(log => log.staffName === selectedStaff);

  const handleExportExcel = () => {
    try {
      // 求你得了，需要轉換 CALL_RESULT_CONFIG 為可讀的文字
      const callLogsWithLabels = filtered.map(log => ({
        ...log,
        result: CALL_RESULT_CONFIG[log.result as keyof typeof CALL_RESULT_CONFIG]?.label || log.result,
      }));
      exportStaffWorkRecord(STAFF_RECORDS, callLogsWithLabels, '銷售人員作業紀錄');
      toast.success('Excel 檔案已匯出成功');
    } catch (error) {
      toast.error('匯出失敗，請稍後重試');
      console.error('Export error:', error);
    }
  };

  return (
    <Layout role="boss">
      <PageHeader
        title="銷售人員作業紀錄"
        subtitle="顧客開發人員撥打記錄•成效統計•老闆全覽"
      />

      <div className="p-6 space-y-6">
        {/* 匯出按鈕 */}
        <div className="flex justify-end">
          <Button 
            onClick={handleExportExcel}
            className="flex items-center gap-2"
            style={{ background: 'oklch(0.28 0.09 250)', color: 'white' }}
          >
            <Download size={18} />
            匯出 Excel
          </Button>
        </div>

        {/* 顧客開發人員卡片 */}
        <div className="grid grid-cols-3 gap-4">
          {STAFF_RECORDS.map(staff => (
            <div key={staff.id} className="bg-white rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground">{staff.staffName}</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{staff.totalCalls}</div>
                  <div className="text-xs text-muted-foreground">總撥打</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{staff.successfulAdds}</div>
                  <div className="text-xs text-muted-foreground">成功加賴</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{staff.conversionRate}%</div>
                  <div className="text-xs text-muted-foreground">顧客答應率</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border">
                <Clock size={12} />
                今日撥打 {staff.todayCallCount} 通
              </div>
            </div>
          ))}
        </div>

        {/* 撥號記錄表 + 今日結果分佈 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 撥號記錄表 */}
          <div className="col-span-2 bg-white rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">撥號記錄</h3>
                <p className="text-xs text-muted-foreground mt-0.5">最近的通話紀錄</p>
              </div>
              <div className="text-xs text-muted-foreground">
                顯示 {filtered.length} 筆
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">人員</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">民宿名稱</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">時間</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">結果</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">備註</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                            {log.staffName.charAt(log.staffName.length - 1)}
                          </div>
                          <span className="font-medium text-foreground">{log.staffName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{log.minsuName}</div>
                        <div className="text-xs text-muted-foreground">{log.area}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{log.time}</td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs', CALL_RESULT_CONFIG[log.result as keyof typeof CALL_RESULT_CONFIG].color)}>
                          {CALL_RESULT_CONFIG[log.result as keyof typeof CALL_RESULT_CONFIG].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 今日結果分佈 */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">今日結果分佈</h3>
            <div className="space-y-3">
              {todayResults.map(item => {
                const config = CALL_RESULT_CONFIG[item.result as keyof typeof CALL_RESULT_CONFIG];
                const color = resultColors[item.result] || { bg: '#9ca3af', text: '#6b7280', bar: '#9ca3af' };
                return (
                  <div key={item.result} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color.bar }} />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{config.label}</div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2 mr-2">
                          <div className="h-2 rounded-full" style={{ width: `${(item.count / CALL_LOGS.length) * 100}%`, background: color.bar }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 整體成效 */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">整體成效</h3>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<Phone size={18} className="text-blue-600" />}
              label="總撥打"
              value={totalCalls}
              sub="通"
              color="bg-blue-50"
            />
            <StatCard
              icon={<CheckCircle size={18} className="text-green-600" />}
              label="成功加賴"
              value={totalSuccessful}
              sub="通"
              color="bg-green-50"
            />
            <StatCard
              icon={<TrendingUp size={18} className="text-purple-600" />}
              label="平均顧客答應率"
              value={`${avgConversionRate}%`}
              sub="整體表現"
              color="bg-purple-50"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

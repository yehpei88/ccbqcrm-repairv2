// CC 代客烤肉 CRM 系統 — 績效結報（老闆管理介面）
// 設計：日報、周報、結報（總累計績效）

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { DAILY_PERFORMANCE, WEEKLY_PERFORMANCE, MONTHLY_PERFORMANCE, STAFF_RECORDS } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Phone, CheckCircle, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportPerformanceReport } from '@/lib/excelExport';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export default function PerformanceReport() {
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  const handleExportExcel = () => {
    try {
      exportPerformanceReport(DAILY_PERFORMANCE, WEEKLY_PERFORMANCE, '績效結報');
      toast.success('Excel 檔案已匯出成功');
    } catch (error) {
      toast.error('匯出失敗，請稍後重試');
      console.error('Export error:', error);
    }
  };

  // 日報統計
  const todayDate = '2026-05-11';
  const todayData = DAILY_PERFORMANCE.filter(d => d.date === todayDate);
  const todayTotalCalls = todayData.reduce((sum, d) => sum + d.totalCalls, 0);
  const todaySuccessful = todayData.reduce((sum, d) => sum + d.successfulAdds, 0);
  const todayConversionRate = Math.round((todaySuccessful / todayTotalCalls) * 100);

  // 周報統計
  const weekTotalCalls = WEEKLY_PERFORMANCE.reduce((sum, d) => sum + d.totalCalls, 0);
  const weekSuccessful = WEEKLY_PERFORMANCE.reduce((sum, d) => sum + d.successfulAdds, 0);
  const weekConversionRate = Math.round((weekSuccessful / weekTotalCalls) * 100);

  // 結報統計（所有數據的總和）
  const totalCalls = DAILY_PERFORMANCE.reduce((sum, d) => sum + d.totalCalls, 0);
  const totalSuccessful = DAILY_PERFORMANCE.reduce((sum, d) => sum + d.successfulAdds, 0);
  const totalConversionRate = totalCalls > 0 ? Math.round((totalSuccessful / totalCalls) * 100) : 0;

  // 篩選的日報資料
  const filteredDailyData = selectedStaff === 'all' 
    ? todayData 
    : todayData.filter(d => d.staffName === selectedStaff);

  // 篩選的周報資料
  const filteredWeeklyData = selectedStaff === 'all' 
    ? WEEKLY_PERFORMANCE 
    : WEEKLY_PERFORMANCE.filter(d => d.staffName === selectedStaff);

  // 篩選的結報資料
  const filteredSummaryData = selectedStaff === 'all'
    ? STAFF_RECORDS.map(staff => {
        const staffDaily = DAILY_PERFORMANCE.filter(d => d.staffName === staff.staffName);
        const calls = staffDaily.reduce((sum, d) => sum + d.totalCalls, 0);
        const successful = staffDaily.reduce((sum, d) => sum + d.successfulAdds, 0);
        const rate = calls > 0 ? Math.round((successful / calls) * 100) : 0;
        return {
          staffName: staff.staffName,
          totalCalls: calls,
          successfulAdds: successful,
          conversionRate: rate,
        };
      })
    : STAFF_RECORDS.filter(s => s.staffName === selectedStaff).map(staff => {
        const staffDaily = DAILY_PERFORMANCE.filter(d => d.staffName === staff.staffName);
        const calls = staffDaily.reduce((sum, d) => sum + d.totalCalls, 0);
        const successful = staffDaily.reduce((sum, d) => sum + d.successfulAdds, 0);
        const rate = calls > 0 ? Math.round((successful / calls) * 100) : 0;
        return {
          staffName: staff.staffName,
          totalCalls: calls,
          successfulAdds: successful,
          conversionRate: rate,
        };
      });

  // 準備圖表資料
  const dailyChartData = filteredDailyData.map(d => ({
    name: d.staffName,
    撥打通數: d.totalCalls,
    成功加賴: d.successfulAdds,
    顧客答應率: d.conversionRate,
  }));

  const weeklyChartData = filteredWeeklyData.map(d => ({
    name: d.staffName,
    撥打通數: d.totalCalls,
    成功加賴: d.successfulAdds,
    顧客答應率: d.conversionRate,
  }));

  const summaryChartData = filteredSummaryData.map(d => ({
    name: d.staffName,
    撥打通數: d.totalCalls,
    成功加賴: d.successfulAdds,
    顧客答應率: d.conversionRate,
  }));

  return (
    <Layout role="boss">
      <PageHeader
        title="績效管理報表"
        subtitle="顧客開發人員日報・周報・結報統計"
      />

      <div className="p-6 space-y-6">
        {/* 篩選器和匯出按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">篩選顧客開發人員：</label>
            <select 
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white"
            >
              <option value="all">全部</option>
              {STAFF_RECORDS.map(staff => (
                <option key={staff.id} value={staff.staffName}>{staff.staffName}</option>
              ))}
            </select>
          </div>
          <Button 
            onClick={handleExportExcel}
            className="flex items-center gap-2"
            style={{ background: 'oklch(0.28 0.09 250)', color: 'white' }}
          >
            <Download size={18} />
            匯出 Excel
          </Button>
        </div>

        {/* 標籤頁 */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">日報</TabsTrigger>
            <TabsTrigger value="weekly">周報</TabsTrigger>
            <TabsTrigger value="summary">結報</TabsTrigger>
          </TabsList>

          {/* 日報內容 */}
          <TabsContent value="daily" className="space-y-6">
            {/* 日報統計卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard 
                icon={<Phone size={20} className="text-white" />}
                label="今日撥打通數"
                value={todayTotalCalls}
                color="bg-blue-500"
              />
              <StatCard 
                icon={<CheckCircle size={20} className="text-white" />}
                label="成功加賴"
                value={todaySuccessful}
                color="bg-green-500"
              />
              <StatCard 
                icon={<TrendingUp size={20} className="text-white" />}
                label="顧客答應率"
                value={`${todayConversionRate}%`}
                color="bg-orange-500"
              />
              <StatCard 
                icon={<Clock size={20} className="text-white" />}
                label="平均通話時長"
                value="4.3分鐘"
                color="bg-purple-500"
              />
            </div>

            {/* 日報詳細表格 */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">日報詳細統計 ({todayDate})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">顧客開發人員</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">撥打通數</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">成功加賴</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">顧客答應率</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">平均通話時長</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDailyData.map((data, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{data.staffName}</td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.totalCalls}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-green-100 text-green-700 border-0">{data.successfulAdds}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-blue-100 text-blue-700 border-0">{data.conversionRate}%</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.avgCallDuration} 分鐘</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 日報圖表 */}
            {dailyChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">日報圖表</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="撥打通數" fill="#3b82f6" />
                    <Bar dataKey="成功加賴" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* 周報內容 */}
          <TabsContent value="weekly" className="space-y-6">
            {/* 周報統計卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard 
                icon={<Phone size={20} className="text-white" />}
                label="本周撥打通數"
                value={weekTotalCalls}
                color="bg-blue-500"
              />
              <StatCard 
                icon={<CheckCircle size={20} className="text-white" />}
                label="成功加賴"
                value={weekSuccessful}
                color="bg-green-500"
              />
              <StatCard 
                icon={<TrendingUp size={20} className="text-white" />}
                label="顧客答應率"
                value={`${weekConversionRate}%`}
                color="bg-orange-500"
              />
              <StatCard 
                icon={<Clock size={20} className="text-white" />}
                label="平均每日撥打"
                value={`${Math.round(weekTotalCalls / 7)} 通`}
                color="bg-purple-500"
              />
            </div>

            {/* 周報詳細表格 */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">周報詳細統計 (2026-05-05 ~ 2026-05-11)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">顧客開發人員</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">撥打通數</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">成功加賴</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">顧客答應率</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">平均每日</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">最佳日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWeeklyData.map((data, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{data.staffName}</td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.totalCalls}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-green-100 text-green-700 border-0">{data.successfulAdds}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-blue-100 text-blue-700 border-0">{data.conversionRate}%</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.avgCallsPerDay} 通</td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.topDay} ({data.topDayCount} 通)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 周報圖表 */}
            {weeklyChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">周報圖表</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="撥打通數" fill="#3b82f6" />
                    <Bar dataKey="成功加賴" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* 結報內容 */}
          <TabsContent value="summary" className="space-y-6">
            {/* 結報統計卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard 
                icon={<Phone size={20} className="text-white" />}
                label="總撥打通數"
                value={totalCalls}
                color="bg-blue-500"
              />
              <StatCard 
                icon={<CheckCircle size={20} className="text-white" />}
                label="成功加賴"
                value={totalSuccessful}
                color="bg-green-500"
              />
              <StatCard 
                icon={<TrendingUp size={20} className="text-white" />}
                label="顧客答應率"
                value={`${totalConversionRate}%`}
                color="bg-orange-500"
              />
            </div>

            {/* 結報詳細表格 */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">結報統計（總累計）</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">顧客開發人員</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">撥打通數</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">成功加賴</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-foreground">顧客答應率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaryData.map((data, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{data.staffName}</td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{data.totalCalls}</td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-green-100 text-green-700 border-0">{data.successfulAdds}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <Badge className="bg-blue-100 text-blue-700 border-0">{data.conversionRate}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 結報圖表 */}
            {summaryChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">結報圖表</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summaryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="撥打通數" fill="#3b82f6" />
                    <Bar dataKey="成功加賴" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

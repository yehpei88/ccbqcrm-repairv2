// CC 代客烤肉 CRM 系統 — Excel 匯出工具
// 設計：將表格資料匯出為 Excel 檔案

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * 匯出績效報表資料為 Excel
 */
export function exportPerformanceReport(
  dailyData: Array<{
    date?: string;
    staffName: string;
    totalCalls: number;
    successfulAdds: number;
    conversionRate: number;
    avgCallDuration?: number;
  }>,
  weeklyData: Array<{
    weekStart?: string;
    weekEnd?: string;
    staffName: string;
    totalCalls: number;
    successfulAdds: number;
    conversionRate: number;
    avgCallsPerDay?: number;
    topDay?: string;
    topDayCount?: number;
  }>,
  fileName: string = '績效管理報表'
) {
  // 建立新的 Workbook
  const workbook = XLSX.utils.book_new();

  // 準備日報資料
  const dailySheetData = [
    ['日報統計', '', '', '', ''],
    ['日期', '顧客開發人員', '撥打通數', '成功加賴', '顧客答應率', '平均通話時長'],
    ...dailyData.map(d => [
      d.date || '',
      d.staffName,
      d.totalCalls,
      d.successfulAdds,
      `${d.conversionRate}%`,
      d.avgCallDuration ? `${d.avgCallDuration}分鐘` : '',
    ]),
  ];

  // 準備周報資料
  const weeklySheetData = [
    ['周報統計', '', '', '', '', '', ''],
    ['周期', '顧客開發人員', '撥打通數', '成功加賴', '顧客答應率', '平均每日', '最佳日期'],
    ...weeklyData.map(d => [
      d.weekStart && d.weekEnd ? `${d.weekStart} ~ ${d.weekEnd}` : '',
      d.staffName,
      d.totalCalls,
      d.successfulAdds,
      `${d.conversionRate}%`,
      d.avgCallsPerDay || '',
      d.topDay ? `${d.topDay} (${d.topDayCount}通)` : '',
    ]),
  ];

  // 建立工作表
  const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
  const weeklySheet = XLSX.utils.aoa_to_sheet(weeklySheetData);

  // 設定列寬
  dailySheet['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
  ];

  weeklySheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
  ];

  // 加入工作表
  XLSX.utils.book_append_sheet(workbook, dailySheet, '日報');
  XLSX.utils.book_append_sheet(workbook, weeklySheet, '周報');

  // 產生檔案名稱（包含時間戳記）
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // 匯出檔案
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * 匯出銷售人員紀錄為 Excel
 */
export function exportStaffWorkRecord(
  staffRecords: Array<{
    staffName: string;
    totalCalls: number;
    successfulAdds: number;
    conversionRate: number;
    todayCallCount: number;
  }>,
  callLogs: Array<{
    staffName: string;
    minsuName: string;
    area: string;
    time: string;
    result: string;
    note: string;
  }>,
  fileName: string = '銷售人員作業紀錄'
) {
  // 建立新的 Workbook
  const workbook = XLSX.utils.book_new();

  // 準備人員統計資料
  const staffSheetData = [
    ['銷售人員統計', '', '', '', ''],
    ['顧客開發人員', '總撥打通數', '成功加賴', '顧客答應率', '今日撥打'],
    ...staffRecords.map(s => [
      s.staffName,
      s.totalCalls,
      s.successfulAdds,
      `${s.conversionRate}%`,
      s.todayCallCount,
    ]),
  ];

  // 準備撥號記錄資料
  const callLogsSheetData = [
    ['撥號記錄詳細', '', '', '', '', ''],
    ['顧客開發人員', '民宿名稱', '地區', '時間', '結果', '備註'],
    ...callLogs.map(log => [
      log.staffName,
      log.minsuName,
      log.area,
      log.time,
      log.result,
      log.note,
    ]),
  ];

  // 建立工作表
  const staffSheet = XLSX.utils.aoa_to_sheet(staffSheetData);
  const callLogsSheet = XLSX.utils.aoa_to_sheet(callLogsSheetData);

  // 設定列寬
  staffSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];

  callLogsSheet['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
  ];

  // 加入工作表
  XLSX.utils.book_append_sheet(workbook, staffSheet, '人員統計');
  XLSX.utils.book_append_sheet(workbook, callLogsSheet, '撥號記錄');

  // 產生檔案名稱（包含時間戳記）
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // 匯出檔案
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * 通用的表格匯出函式
 */
export function exportTableToExcel(
  data: Array<Record<string, any>>,
  headers: string[],
  sheetName: string = 'Sheet1',
  fileName: string = '資料匯出'
) {
  // 建立新的 Workbook
  const workbook = XLSX.utils.book_new();

  // 準備資料
  const sheetData = [
    headers,
    ...data.map(row => headers.map(header => row[header] || '')),
  ];

  // 建立工作表
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

  // 設定列寬
  sheet['!cols'] = headers.map(() => ({ wch: 15 }));

  // 加入工作表
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  // 產生檔案名稱（包含時間戳記）
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // 匯出檔案
  XLSX.writeFile(workbook, fullFileName);
}

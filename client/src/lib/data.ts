// CC 代客烤肉 CRM 系統 — 共用資料與型別定義
// 設計風格：現代商業 CRM，深藍側欄 + 白底主內容區

export type PinStatus = 'red-star' | 'red' | 'green' | 'purple' | 'gold';
export type CallResult = 'agreed' | 'hesitating' | 'rejected' | 'invalid' | 'closed';
export type IntentLabel = 'hot' | 'inquiring' | 'rejected' | 'seen';

export interface Minsu {
  id: string;
  name: string;
  address: string;
  phone: string;
  area: string;
  pinStatus: PinStatus;
  aiScore: number;
  callResult?: CallResult;
  intentLabel?: IntentLabel;
  cooperationCount: number;
  lastCoopDate?: string;
  totalRevenue: number;
  hasRainShelter: boolean;
  isPackage: boolean;
  distanceFromCity: number;
  note?: string;
  lineAdded: boolean;
  rfmR?: number;
  rfmF?: number;
  rfmM?: number;
}

export interface Alert {
  id: string;
  minsuName: string;
  type: 'hot' | 'seen' | 'price';
  message: string;
  time: string;
  read: boolean;
}

export interface PricingSuggestion {
  id: string;
  minsuName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  discount?: string;
  status: 'pending' | 'approved' | 'sent';
}

// Pin 狀態定義
export const PIN_STATUS_CONFIG = {
  'red-star': {
    label: '🔴⭐ 紅星',
    desc: '高潛力未開發',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
  },
  'red': {
    label: '🔴 紅標',
    desc: '一般未開發',
    color: 'bg-red-400',
    textColor: 'text-red-500',
    bgLight: 'bg-red-50',
    border: 'border-red-100',
  },
  'green': {
    label: '🟢 綠標',
    desc: '已開發/已加 LINE',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    border: 'border-green-200',
  },
  'purple': {
    label: '🟣 紫標',
    desc: '合作中 (1-3 次)',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    bgLight: 'bg-purple-50',
    border: 'border-purple-200',
  },
  'gold': {
    label: '🟡 金標',
    desc: 'VIP 客戶 (≥ 3 次)',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
} as const;

// 電話回饋狀態
export const CALL_RESULT_CONFIG = {
  'agreed': { label: '✅ 答應加賴', color: 'bg-green-100 text-green-700' },
  'hesitating': { label: '⏳ 猶豫中', color: 'bg-yellow-100 text-yellow-700' },
  'rejected': { label: '❌ 拒絕加賴', color: 'bg-red-100 text-red-700' },
  'invalid': { label: '📵 空號', color: 'bg-gray-100 text-gray-600' },
  'closed': { label: '🚫 不營業', color: 'bg-gray-100 text-gray-500' },
} as const;

// 意向標籤
export const INTENT_CONFIG = {
  'hot': { label: '🔥 高熱度', color: 'bg-red-100 text-red-700 border-red-200' },
  'inquiring': { label: '💬 詢價中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'rejected': { label: '🙅 婉拒', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  'seen': { label: '👁 已讀', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
} as const;

// 模擬民宿資料
export const MOCK_MINSU_DATA: Minsu[] = [
  { id: '1', name: '礁溪山景民宿', address: '宜蘭縣礁溪鄉溫泉路 12 號', phone: '03-9881234', area: '礁溪鄉', pinStatus: 'gold', aiScore: 42, callResult: 'agreed', intentLabel: 'hot', cooperationCount: 5, lastCoopDate: '2026-04-15', totalRevenue: 28500, hasRainShelter: true, isPackage: true, distanceFromCity: 8, lineAdded: true, rfmR: 27, rfmF: 5, rfmM: 28500 },
  { id: '2', name: '頭城海景渡假村', address: '宜蘭縣頭城鎮濱海路 88 號', phone: '03-9771234', area: '頭城鎮', pinStatus: 'gold', aiScore: 38, callResult: 'agreed', intentLabel: 'inquiring', cooperationCount: 4, lastCoopDate: '2026-03-20', totalRevenue: 22000, hasRainShelter: true, isPackage: true, distanceFromCity: 15, lineAdded: true, rfmR: 53, rfmF: 4, rfmM: 22000 },
  { id: '3', name: '員山竹林小屋', address: '宜蘭縣員山鄉深溝路 45 號', phone: '03-9231234', area: '員山鄉', pinStatus: 'gold', aiScore: 35, callResult: 'agreed', intentLabel: 'hot', cooperationCount: 3, lastCoopDate: '2026-05-01', totalRevenue: 15600, hasRainShelter: false, isPackage: true, distanceFromCity: 12, lineAdded: true, rfmR: 11, rfmF: 3, rfmM: 15600 },
  { id: '4', name: '冬山河畔民宿', address: '宜蘭縣冬山鄉冬山路 23 號', phone: '03-9591234', area: '冬山鄉', pinStatus: 'purple', aiScore: 31, callResult: 'agreed', intentLabel: 'inquiring', cooperationCount: 2, lastCoopDate: '2026-04-28', totalRevenue: 9800, hasRainShelter: true, isPackage: false, distanceFromCity: 18, lineAdded: true, rfmR: 14, rfmF: 2, rfmM: 9800 },
  { id: '5', name: '三星蔥田農莊', address: '宜蘭縣三星鄉三星路 67 號', phone: '03-9891234', area: '三星鄉', pinStatus: 'purple', aiScore: 28, callResult: 'agreed', intentLabel: 'seen', cooperationCount: 1, lastCoopDate: '2026-02-14', totalRevenue: 4200, hasRainShelter: false, isPackage: false, distanceFromCity: 22, lineAdded: true, rfmR: 87, rfmF: 1, rfmM: 4200 },
  { id: '6', name: '羅東夜市旁民宿', address: '宜蘭縣羅東鎮中正路 156 號', phone: '03-9541234', area: '羅東鎮', pinStatus: 'green', aiScore: 25, callResult: 'agreed', intentLabel: 'inquiring', cooperationCount: 0, lastCoopDate: undefined, totalRevenue: 0, hasRainShelter: true, isPackage: false, distanceFromCity: 5, lineAdded: true, rfmR: 0, rfmF: 0, rfmM: 0 },
  { id: '7', name: '蘇澳冷泉民宿', address: '宜蘭縣蘇澳鎮冷泉路 34 號', phone: '03-9961234', area: '蘇澳鎮', pinStatus: 'red-star', aiScore: 44, callResult: undefined, intentLabel: undefined, cooperationCount: 0, lastCoopDate: undefined, totalRevenue: 0, hasRainShelter: true, isPackage: true, distanceFromCity: 25, lineAdded: false, rfmR: 0, rfmF: 0, rfmM: 0 },
  { id: '8', name: '五結鄉野風情', address: '宜蘭縣五結鄉五結路 78 號', phone: '03-9501234', area: '五結鄉', pinStatus: 'red-star', aiScore: 41, callResult: undefined, intentLabel: undefined, cooperationCount: 0, lastCoopDate: undefined, totalRevenue: 0, hasRainShelter: true, isPackage: true, distanceFromCity: 10, lineAdded: false, rfmR: 0, rfmF: 0, rfmM: 0 },
  { id: '9', name: '壯圍海岸民宿', address: '宜蘭縣壯圍鄉壯濱路 99 號', phone: '03-9381234', area: '壯圍鄉', pinStatus: 'red', aiScore: 18, callResult: undefined, intentLabel: undefined, cooperationCount: 0, lastCoopDate: undefined, totalRevenue: 0, hasRainShelter: false, isPackage: false, distanceFromCity: 7, lineAdded: false, rfmR: 0, rfmF: 0, rfmM: 0 },
  { id: '10', name: '大同山林秘境', address: '宜蘭縣大同鄉英士路 11 號', phone: '03-9801234', area: '大同鄉', pinStatus: 'red', aiScore: 15, callResult: 'rejected', intentLabel: undefined, cooperationCount: 0, lastCoopDate: undefined, totalRevenue: 0, hasRainShelter: false, isPackage: false, distanceFromCity: 35, lineAdded: false, rfmR: 0, rfmF: 0, rfmM: 0 },
];

// 模擬警示資料
export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', minsuName: '礁溪山景民宿', type: 'hot', message: '客戶詢問 6/20 檔期，並詢問訂金方式，意向強烈', time: '10 分鐘前', read: false },
  { id: 'a2', minsuName: '員山竹林小屋', type: 'hot', message: '明確表達預約意願，詢問最早可服務日期', time: '35 分鐘前', read: false },
  { id: 'a3', minsuName: '冬山河畔民宿', type: 'seen', message: '已讀超過 3 天未回應，建議補發優惠訊息', time: '2 小時前', read: true },
  { id: 'a4', minsuName: '三星蔥田農莊', type: 'seen', message: '已讀超過 7 天未回應，建議工讀生回訪', time: '1 天前', read: true },
];

// 模擬定價建議
export const MOCK_PRICING: PricingSuggestion[] = [
  { id: 'p1', minsuName: '礁溪山景民宿', currentPrice: 4500, suggestedPrice: 4200, reason: '合作 5 次以上，建議給予 VIP 長期合作折扣', discount: '9 折優惠', status: 'pending' },
  { id: 'p2', minsuName: '頭城海景渡假村', currentPrice: 4500, suggestedPrice: 4000, reason: '端午節檔期促銷，叫貨量達折扣門檻（20 人以上）', discount: '端午特惠', status: 'pending' },
  { id: 'p3', minsuName: '員山竹林小屋', currentPrice: 4500, suggestedPrice: 4300, reason: '新 VIP 客戶升等優惠，鞏固合作關係', discount: '新 VIP 禮遇', status: 'approved' },
];

// 月份業績資料
export const MONTHLY_REVENUE = [
  { month: '1月', revenue: 42000, orders: 9 },
  { month: '2月', revenue: 38000, orders: 8 },
  { month: '3月', revenue: 55000, orders: 12 },
  { month: '4月', revenue: 61000, orders: 14 },
  { month: '5月', revenue: 48000, orders: 11 },
  { month: '6月', revenue: 72000, orders: 16 },
  { month: '7月', revenue: 89000, orders: 20 },
  { month: '8月', revenue: 95000, orders: 22 },
  { month: '9月', revenue: 68000, orders: 15 },
  { month: '10月', revenue: 74000, orders: 17 },
  { month: '11月', revenue: 52000, orders: 12 },
  { month: '12月', revenue: 63000, orders: 14 },
];

// 客戶類型分佈
export const CUSTOMER_TYPE_DATA = [
  { name: '露營區', value: 35, color: '#22c55e' },
  { name: '私宅民宿', value: 28, color: '#3b82f6' },
  { name: '包棟民宿', value: 22, color: '#a855f7' },
  { name: '農場民宿', value: 10, color: '#f97316' },
  { name: '其他', value: 5, color: '#94a3b8' },
];

// 客戶開發接受率成長資料
export const ACCEPTANCE_RATE_DATA = [
  { month: '1月', before: 8, after: 18 },
  { month: '2月', before: 9, after: 20 },
  { month: '3月', before: 10, after: 24 },
  { month: '4月', before: 11, after: 28 },
  { month: '5月', before: 12, after: 31 },
];

// 客戶開發成交率成長資料
export const CONVERSION_RATE_DATA = [
  { month: '1月', before: 5, after: 12 },
  { month: '2月', before: 6, after: 14 },
  { month: '3月', before: 7, after: 17 },
  { month: '4月', before: 8, after: 19 },
  { month: '5月', before: 9, after: 22 },
];


// 工讀生作業紀錄型別
export interface StaffRecord {
  id: string;
  staffName: string;
  staffStatus: 'on-duty' | 'off-duty' | 'break';
  totalCalls: number;
  successfulAdds: number;
  conversionRate: number;
  todayCallCount: number;
}

export interface CallLog {
  id: string;
  staffName: string;
  minsuName: string;
  area: string;
  time: string;
  result: 'agreed' | 'hesitating' | 'rejected' | 'invalid' | 'closed';
  note: string;
}

// 工讀生作業紀錄模擬資料
export const STAFF_RECORDS: StaffRecord[] = [
  { id: '1', staffName: '小陳', staffStatus: 'on-duty', totalCalls: 23, successfulAdds: 15, conversionRate: 65, todayCallCount: 8 },
  { id: '2', staffName: '小林', staffStatus: 'on-duty', totalCalls: 18, successfulAdds: 11, conversionRate: 61, todayCallCount: 6 },
  { id: '3', staffName: '小王', staffStatus: 'break', totalCalls: 15, successfulAdds: 8, conversionRate: 53, todayCallCount: 5 },
];

export const CALL_LOGS: CallLog[] = [
  { id: '1', staffName: '小陳', minsuName: '礁溪山景民宿', area: '礁溪鄉・44分', time: '10:32', result: 'agreed', note: '老闆很有興趣，說下週回電' },
  { id: '2', staffName: '小陳', minsuName: '員山竹林小屋', area: '員山鄉・28分', time: '10:15', result: 'hesitating', note: '需要再考慮，7天後追蹤' },
  { id: '3', staffName: '小林', minsuName: '冬山包棟農莊', area: '冬山鄉・22分', time: '09:58', result: 'agreed', note: '已加LINE，等待後續追蹤' },
  { id: '4', staffName: '小陳', minsuName: '壯圍庭院民宿', area: '壯圍鄉・18分', time: '09:45', result: 'rejected', note: '說目前不需要' },
  { id: '5', staffName: '小林', minsuName: '三星農莊民宿', area: '三星鄉・15分', time: '09:30', result: 'invalid', note: '電話無人接聽' },
  { id: '6', staffName: '小陳', minsuName: '五結包棟合宿', area: '五結鄉・20分', time: '09:20', result: 'agreed', note: '很友善，已加LINE' },
];

// 績效報表資料結構
export interface DailyPerformance {
  date: string;
  staffName: string;
  totalCalls: number;
  successfulAdds: number;
  conversionRate: number;
  avgCallDuration: number; // 分鐘
}

export interface WeeklyPerformance {
  weekStart: string;
  weekEnd: string;
  staffName: string;
  totalCalls: number;
  successfulAdds: number;
  conversionRate: number;
  avgCallsPerDay: number;
  topDay: string;
  topDayCount: number;
}

// 日報模擬資料
export const DAILY_PERFORMANCE: DailyPerformance[] = [
  { date: '2026-05-11', staffName: '小陳', totalCalls: 8, successfulAdds: 5, conversionRate: 63, avgCallDuration: 4.2 },
  { date: '2026-05-11', staffName: '小林', totalCalls: 6, successfulAdds: 4, conversionRate: 67, avgCallDuration: 5.1 },
  { date: '2026-05-11', staffName: '小王', totalCalls: 5, successfulAdds: 2, conversionRate: 40, avgCallDuration: 3.8 },
  { date: '2026-05-10', staffName: '小陳', totalCalls: 7, successfulAdds: 4, conversionRate: 57, avgCallDuration: 4.5 },
  { date: '2026-05-10', staffName: '小林', totalCalls: 5, successfulAdds: 3, conversionRate: 60, avgCallDuration: 4.8 },
  { date: '2026-05-10', staffName: '小王', totalCalls: 4, successfulAdds: 2, conversionRate: 50, avgCallDuration: 4.0 },
];

// 周報模擬資料
export const WEEKLY_PERFORMANCE: WeeklyPerformance[] = [
  { weekStart: '2026-05-05', weekEnd: '2026-05-11', staffName: '小陳', totalCalls: 56, successfulAdds: 35, conversionRate: 63, avgCallsPerDay: 8, topDay: '2026-05-11', topDayCount: 9 },
  { weekStart: '2026-05-05', weekEnd: '2026-05-11', staffName: '小林', totalCalls: 42, successfulAdds: 27, conversionRate: 64, avgCallsPerDay: 6, topDay: '2026-05-09', topDayCount: 8 },
  { weekStart: '2026-05-05', weekEnd: '2026-05-11', staffName: '小王', totalCalls: 35, successfulAdds: 18, conversionRate: 51, avgCallsPerDay: 5, topDay: '2026-05-07', topDayCount: 7 },
];

// CC 代客烤肉 CRM 系統 — 老闆定價建議頁面
// 設計：RFM 分析建議清單 + 詳細設定面板（雙欄式佈局）

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Send, Mail, MessageSquare, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 模擬定價建議資料
const PRICING_SUGGESTIONS = [
  {
    id: '1',
    name: '頭城海景木屋',
    sub: '合作 4 次・VIP 客戶',
    dot: '#BA7517',
    rfm: [
      { label: 'VIP', color: 'bg-orange-100 text-orange-700' },
      { label: '達標建議', color: 'bg-blue-100 text-blue-600' }
    ],
    suggest: '9折',
    r: '3週',
    f: '4次',
    fColor: '#633806',
    m: '高',
    mColor: '#185FA5',
    reason: '合作次數已達 4 次，符合 VIP 門檻；近期消費頻繁且貢獻度高。建議給予 <strong>9折優惠</strong> 以強化長期合作關係，預防競爭對手切入。',
    discount: 9,
    msgTemplate: '您好，陳老闆！感謝一直以來的支持 🙏<br>本次合作特別提供 <strong>{discount}折優惠</strong>，歡迎把握機會！<br>有任何問題歡迎隨時聯繫我們 🔥'
  },
  {
    id: '2',
    name: '蘇澳白色渡假屋',
    sub: '合作 2 次・合作中',
    dot: '#7F77DD',
    rfm: [
      { label: '合作中', color: 'bg-purple-100 text-purple-700' },
      { label: '節慶優惠', color: 'bg-blue-100 text-blue-600' }
    ],
    suggest: '95折',
    r: '5週',
    f: '2次',
    fColor: '#534AB7',
    m: '中',
    mColor: '#534AB7',
    reason: '中秋節慶即將到來，合作頻率穩定上升。建議給予 <strong>95折節慶優惠</strong>，趁節慶時間強化關係、促進回購。',
    discount: 9.5,
    msgTemplate: '您好，林老闆！中秋佳節即將到來 🎑<br>特別提供 <strong>{discount}折節慶優惠</strong>，感謝一直以來的支持！<br>歡迎提前預約中秋場次 🔥'
  },
  {
    id: '3',
    name: '羅東溫泉民宿',
    sub: '合作 1 次・已開發',
    dot: '#639922',
    rfm: [
      { label: '已開發', color: 'bg-green-100 text-green-700' },
      { label: '沉睡提醒', color: 'bg-gray-100 text-gray-600' }
    ],
    suggest: '回訪',
    r: '8週',
    f: '1次',
    fColor: '#3B6D11',
    m: '低',
    mColor: '#B4B2A9',
    reason: '距離上次合作已超過 8 週，屬於沉睡客戶。建議主動發送關懷訊息，詢問近期是否有合作需求，防止客戶流失。',
    discount: 10,
    msgTemplate: '您好，張老闆！好久不見，最近一切都好嗎？😊<br>想關心一下是否近期有合作需求，隨時歡迎聯繫我們！'
  }
];

export default function PricingPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [discount, setDiscount] = useState(PRICING_SUGGESTIONS[0].discount);
  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [customMessage, setCustomMessage] = useState(PRICING_SUGGESTIONS[0].msgTemplate);

  const selected = PRICING_SUGGESTIONS[selectedIdx];
  const displayMessage = isEditingMsg ? customMessage : selected.msgTemplate.replace('{discount}', discount.toString());

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setDiscount(PRICING_SUGGESTIONS[idx].discount);
    setCustomMessage(PRICING_SUGGESTIONS[idx].msgTemplate);
    setIsEditingMsg(false);
  };

  const handleSend = (channel: 'line' | 'gmail') => {
    toast.success(`已透過 ${channel === 'line' ? 'LINE' : 'Gmail'} 發送優惠給「${selected.name}」`);
  };

  return (
    <Layout role="boss">
      <PageHeader
        title="定價建議"
        subtitle="RFM 分析建議清單 — 老闆確認後自動發送優惠"
      />

      <div className="p-6">
        {/* 雙欄式佈局 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 左欄：建議清單 */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">RFM 分析建議清單</h3>
              </div>
              <Badge className="bg-red-100 text-red-700 border-0">
                {PRICING_SUGGESTIONS.length} 筆待確認
              </Badge>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI 建議給予優惠
              </div>

              {PRICING_SUGGESTIONS.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    selectedIdx === idx
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-border/80 hover:bg-muted/30'
                  )}
                  onClick={() => handleSelect(idx)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: item.dot }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {item.rfm.map((tag, i) => (
                        <span key={i} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tag.color)}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-red-600">{item.suggest}</div>
                    <div className="text-xs text-muted-foreground">建議折扣</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右欄：詳細設定 */}
          <div className="bg-muted/20 rounded-xl border border-border p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* 標題 */}
            <div>
              <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
              <div className="text-xs text-muted-foreground mt-0.5">{selected.sub}</div>
            </div>

            {/* RFM 分析 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                RFM 分析
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2.5 text-center border border-border">
                  <div className="text-base font-bold text-foreground">{selected.r}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">R 最近消費</div>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-border">
                  <div className="text-base font-bold" style={{ color: selected.fColor }}>
                    {selected.f}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">F 消費頻率</div>
                </div>
                <div className="bg-white rounded-lg p-2.5 text-center border border-border">
                  <div className="text-base font-bold" style={{ color: selected.mColor }}>
                    {selected.m}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">M 貢獻度</div>
                </div>
              </div>
            </div>

            {/* AI 建議原因 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                AI 建議原因
              </div>
              <div className="bg-white rounded-lg border-l-4 border-l-blue-500 p-3 text-sm text-muted-foreground leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: selected.reason }} />
              </div>
            </div>

            {/* 老闆調整折扣 */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                老闆調整折扣
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-foreground flex-1">最終折扣</span>
                <span className="text-2xl font-bold text-red-600">{discount}</span>
                <span className="text-sm text-muted-foreground">折</span>
              </div>
              <Slider
                value={[discount]}
                onValueChange={(val) => setDiscount(val[0])}
                min={7}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>7折</span>
                <span>8折</span>
                <span>9折</span>
                <span>10折</span>
              </div>
            </div>

            {/* 訊息預覽與編輯 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  訊息預覽
                </div>
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  onClick={() => setIsEditingMsg(!isEditingMsg)}
                >
                  <Edit2 size={11} />
                  {isEditingMsg ? '完成' : '編輯'}
                </button>
              </div>
              {isEditingMsg ? (
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="text-sm resize-none"
                  rows={5}
                  placeholder="編輯 LINE 訊息內容..."
                />
              ) : (
                <div className="bg-white rounded-lg p-3 text-sm text-foreground leading-relaxed border border-border">
                  <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded mr-1 font-medium">
                    LINE
                  </span>
                  <div dangerouslySetInnerHTML={{ __html: displayMessage }} />
                </div>
              )}
            </div>

            {/* 發送按鈕 */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 gap-1.5 bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleSend('line')}
              >
                <MessageSquare size={14} />
                發送 LINE
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleSend('gmail')}
              >
                <Mail size={14} />
                發送 Gmail
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => toast.info('已略過此建議')}
              >
                略過
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

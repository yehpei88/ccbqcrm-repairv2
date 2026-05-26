// CC 代客烤肉 CRM 系統 — 老闆 AI 意向警示頁面
// 設計：即時警示列表，高熱度商機置頂，意向標籤分類

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { MOCK_MINSU_DATA, INTENT_CONFIG, type Minsu } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { FollowUpDialog } from '@/components/FollowUpDialog';
import { toast } from 'sonner';
import {
  Bell, Flame, MessageSquare, Eye, ThumbsDown,
  Phone, Mail, CheckCheck, Clock, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 所有有意向標籤的民宿
const INTENT_DATA = MOCK_MINSU_DATA.filter(m => m.intentLabel);

// 模擬 LINE 對話記錄
const MOCK_CONVERSATIONS: Record<string, { role: 'client' | 'system'; text: string; time: string }[]> = {
  '1': [
    { role: 'client', text: '你好，請問你們 6/20 有空嗎？我們想訂烤肉服務', time: '10:23' },
    { role: 'system', text: '您好！6/20 目前有空檔，請問幾位用餐呢？', time: '10:24' },
    { role: 'client', text: '大概 20 人，包棟，請問訂金怎麼付？', time: '10:26' },
  ],
  '3': [
    { role: 'system', text: '您好！感謝您的詢問，請問有什麼可以幫您的嗎？', time: '05/08 14:30' },
    { role: 'client', text: '（已讀）', time: '05/08 14:35' },
  ],
};

function IntentIcon({ label }: { label: string }) {
  if (label === 'hot') return <Flame size={16} className="text-red-500" />;
  if (label === 'inquiring') return <MessageSquare size={16} className="text-blue-500" />;
  if (label === 'rejected') return <ThumbsDown size={16} className="text-gray-400" />;
  return <Eye size={16} className="text-yellow-500" />;
}

function AlertCard({ minsu, onView, onFollowUp }: { minsu: Minsu; onView: (m: Minsu) => void; onFollowUp: (m: Minsu) => void }) {
  const intentCfg = INTENT_CONFIG[minsu.intentLabel!];
  const isHot = minsu.intentLabel === 'hot';
  const isSeen = minsu.intentLabel === 'seen';

  return (
    <div className={cn(
      'bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow',
      isHot ? 'border-red-200 ring-1 ring-red-100' : 'border-border'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          isHot ? 'bg-red-50' : isSeen ? 'bg-yellow-50' : 'bg-blue-50'
        )}>
          <IntentIcon label={minsu.intentLabel!} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{minsu.name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', intentCfg.color)}>
              {intentCfg.label}
            </span>
            {isHot && (
              <Badge className="text-xs bg-red-500 text-white border-0 animate-pulse">
                需立即處理
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {isHot && '客戶詢問檔期與訂金方式，意向強烈，建議立即回覆'}
            {minsu.intentLabel === 'inquiring' && '客戶正在詢問服務細節與報價，建議推送成功案例'}
            {minsu.intentLabel === 'seen' && `已讀超過 ${minsu.rfmR ?? 3} 天未回應，建議補發優惠訊息或安排回訪`}
            {minsu.intentLabel === 'rejected' && '客戶表達近期無需求，已設定 90 天冷卻期'}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={11} />
              <span>{isHot ? '10 分鐘前' : isSeen ? '2 小時前' : '1 天前'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone size={11} />
              <span>{minsu.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1"
            style={isHot ? { background: 'oklch(0.65 0.22 25)', color: 'white' } : {}}
            onClick={() => onView(minsu)}
          >
            <ArrowRight size={11} />
            查看對話
          </Button>
          {(isSeen || minsu.intentLabel === 'inquiring') && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => onFollowUp(minsu)}
            >
              <Phone size={11} />
              一鍵回訪
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs gap-1"
            onClick={() => toast.success(`已標記「${minsu.name}」為已處理`)}
          >
            <CheckCheck size={11} />
            標記處理
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [filterIntent, setFilterIntent] = useState<string>('all');
  const [selectedMinsu, setSelectedMinsu] = useState<Minsu | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpTarget, setFollowUpTarget] = useState<Minsu | null>(null);

  const filtered = filterIntent === 'all'
    ? INTENT_DATA
    : INTENT_DATA.filter(m => m.intentLabel === filterIntent);

  // 高熱度置頂
  const sorted = [...filtered].sort((a, b) => {
    const order = { hot: 0, inquiring: 1, seen: 2, rejected: 3 };
    return (order[a.intentLabel!] ?? 99) - (order[b.intentLabel!] ?? 99);
  });

  const hotCount = INTENT_DATA.filter(m => m.intentLabel === 'hot').length;
  const seenCount = INTENT_DATA.filter(m => m.intentLabel === 'seen').length;

  const handleView = (minsu: Minsu) => {
    setSelectedMinsu(minsu);
    setShowConversation(true);
  };

  return (
    <Layout role="boss">
      <PageHeader
        title="AI 意向警示"
        subtitle="GPT 語意分析結果 — 高熱度商機即時通知"
        actions={
          <div className="flex items-center gap-2">
            {hotCount > 0 && (
              <Badge className="bg-red-500 text-white border-0">
                {hotCount} 筆高熱度
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => toast.success('已全部標記為已讀')}
            >
              <CheckCheck size={13} />
              全部已讀
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '🔥 高熱度', count: INTENT_DATA.filter(m => m.intentLabel === 'hot').length, color: 'bg-red-50 border-red-100', textColor: 'text-red-700', desc: '需立即跟進' },
            { label: '💬 詢價中', count: INTENT_DATA.filter(m => m.intentLabel === 'inquiring').length, color: 'bg-blue-50 border-blue-100', textColor: 'text-blue-700', desc: '推送成功案例' },
            { label: '👁 已讀', count: INTENT_DATA.filter(m => m.intentLabel === 'seen').length, color: 'bg-yellow-50 border-yellow-100', textColor: 'text-yellow-700', desc: '補發優惠訊息' },
            { label: '🙅 婉拒', count: INTENT_DATA.filter(m => m.intentLabel === 'rejected').length, color: 'bg-gray-50 border-gray-100', textColor: 'text-gray-600', desc: '90 天冷卻期' },
          ].map(item => (
            <div
              key={item.label}
              className={cn('rounded-xl p-4 border cursor-pointer transition-all', item.color,
                filterIntent === item.label.split(' ')[1].toLowerCase() ? 'ring-2 ring-primary' : ''
              )}
              onClick={() => setFilterIntent(
                filterIntent === item.label.split(' ')[1].toLowerCase()
                  ? 'all'
                  : item.label.split(' ')[1].toLowerCase()
              )}
            >
              <div className={cn('text-2xl font-black', item.textColor)}>{item.count}</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 篩選標籤 */}
        <div className="flex items-center gap-2">
          {['all', 'hot', 'inquiring', 'seen', 'rejected'].map(f => (
            <button
              key={f}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors font-medium',
                filterIntent === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
              onClick={() => setFilterIntent(f)}
            >
              {f === 'all' ? '全部' :
                f === 'hot' ? '🔥 高熱度' :
                  f === 'inquiring' ? '💬 詢價中' :
                    f === 'seen' ? '👁 已讀' : '🙅 婉拒'}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">共 {sorted.length} 筆</span>
        </div>

        {/* 警示卡片列表 */}
        <div className="space-y-3">
          {sorted.map(minsu => (
            <AlertCard key={minsu.id} minsu={minsu} onView={handleView} onFollowUp={(m) => { setFollowUpTarget(m); setShowFollowUp(true); }} />
          ))}
          {sorted.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">目前沒有符合條件的警示</div>
            </div>
          )}
        </div>
      </div>

      {/* LINE 對話 Dialog */}
      <Dialog open={showConversation} onOpenChange={setShowConversation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={16} className="text-green-500" />
              LINE 對話記錄 — {selectedMinsu?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMinsu && (
            <div className="space-y-4">
              {/* AI 意向分析結果 */}
              <div className={cn(
                'rounded-lg p-3 text-sm border',
                selectedMinsu.intentLabel === 'hot'
                  ? 'bg-red-50 border-red-100 text-red-700'
                  : 'bg-blue-50 border-blue-100 text-blue-700'
              )}>
                <div className="font-semibold mb-1">
                  AI 意向分析：{INTENT_CONFIG[selectedMinsu.intentLabel!].label}
                </div>
                <div className="text-xs">
                  {selectedMinsu.intentLabel === 'hot'
                    ? '偵測到明確預約意願，詢問訂金方式，建議立即回覆並確認檔期'
                    : '偵測到詢價行為，建議推送成功案例與優惠方案'}
                </div>
              </div>

              {/* 對話記錄 */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(MOCK_CONVERSATIONS[selectedMinsu.id] ?? [
                  { role: 'client', text: '你好，想了解你們的烤肉服務', time: '14:30' },
                  { role: 'system', text: '您好！歡迎詢問，我們提供宜蘭全區代客烤肉服務', time: '14:31' },
                ]).map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'client' ? 'justify-start' : 'justify-end')}>
                    <div className={cn(
                      'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'client'
                        ? 'bg-muted text-foreground'
                        : 'bg-green-500 text-white'
                    )}>
                      <div>{msg.text}</div>
                      <div className={cn('text-xs mt-0.5', msg.role === 'client' ? 'text-muted-foreground' : 'text-green-100')}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 快速回覆按鈕 */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">快速回覆</div>
                <div className="flex flex-wrap gap-2">
                  {['確認檔期', '發送菜單', '報價說明', '訂金資訊'].map(action => (
                    <button
                      key={action}
                      className="text-xs px-3 py-1.5 rounded-full border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                      onClick={() => {
                        toast.success(`已發送「${action}」訊息`);
                        setShowConversation(false);
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setShowConversation(false)}>關閉</Button>
            <Button size="sm" className="gap-1"
              style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
              onClick={() => {
                toast.success('已發送 Gmail 警示給老闆');
                setShowConversation(false);
              }}>
              <Mail size={13} />
              Gmail 警示
            </Button>
          </DialogFooter>
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
    </Layout>
  );
}

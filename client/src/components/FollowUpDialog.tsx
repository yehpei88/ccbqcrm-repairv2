import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Minsu } from '@/lib/data';

export interface FollowUpTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  content: string;
  color: string;
}

interface FollowUpDialogProps {
  open: boolean;
  minsu: Minsu | null;
  onOpenChange: (open: boolean) => void;
  onSend?: (template: FollowUpTemplate) => void;
}

// 訊息範本庫
const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: 'care',
    name: '關懷型',
    icon: '💌',
    description: '溫暖問候，增進感情',
    content: '好久不見！最近民宿生意好嗎？CC 烤肉推出新菜單，有空可以參考看看喔！',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    id: 'promo',
    name: '促銷型',
    icon: '🎁',
    description: 'VIP 專屬優惠，激發購買慾',
    content: '感謝支持！身為我們的紫標 VIP，本月預約可享 9 折優惠，代碼：VIP90',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    id: 'inquiry',
    name: '詢問型',
    icon: '❓',
    description: '詢問需求，提供協助',
    content: '您好！想起您之前詢問的 6 月檔期，我們現在有特別方案，要不要聊一下？',
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    id: 'event',
    name: '活動型',
    icon: '🎉',
    description: '推廣新活動或季節優惠',
    content: '夏季烤肉季開跑！CC 烤肉推出限時優惠，新客享 8 折，回客享 9 折，邀您一起參與！',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
];

export function FollowUpDialog({ open, minsu, onOpenChange, onSend }: FollowUpDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FollowUpTemplate | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    if (!selectedTemplate || !minsu) return;

    setIsSending(true);
    // 模擬 1 秒發送延遲
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSendSuccess(true);
    setIsSending(false);

    // 調用回調
    onSend?.(selectedTemplate);

    // 2 秒後關閉對話框
    setTimeout(() => {
      toast.success(`✅ 已透過 LINE API 發送回訪訊息至「${minsu.name}」`, {
        description: `使用範本：${selectedTemplate.name}`,
        duration: 3000,
      });
      onOpenChange(false);
      setSelectedTemplate(null);
      setSendSuccess(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            模擬發送回訪訊息 {minsu && `- ${minsu.name}`}
          </DialogTitle>
        </DialogHeader>

        {!sendSuccess ? (
          <div className="space-y-6 py-4">
            {/* 客戶信息卡片 */}
            {minsu && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 font-medium">民宿名稱</span>
                    <p className="text-slate-900 font-semibold mt-1">{minsu.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">地區</span>
                    <p className="text-slate-900 font-semibold mt-1">{minsu.area}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">AI 意向</span>
                    <p className="text-slate-900 font-semibold mt-1">
                      {minsu.intentLabel === 'hot' && '🔥 熱度高'}
                      {minsu.intentLabel === 'inquiring' && '💬 詢價中'}
                      {minsu.intentLabel === 'seen' && '👁️ 已讀未回'}
                      {minsu.intentLabel === 'rejected' && '❌ 已拒絕'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 訊息範本選擇 */}
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-3 block">
                選擇訊息範本
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FOLLOW_UP_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      selectedTemplate?.id === template.id
                        ? `${template.color} border-current ring-2 ring-offset-2`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-lg mb-1">{template.icon}</div>
                        <div className="font-semibold text-sm">{template.name}</div>
                        <div className="text-xs text-slate-600 mt-1">{template.description}</div>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 訊息預覽 */}
            {selectedTemplate && (
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">
                  訊息預覽
                </label>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">CC</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 leading-relaxed">
                        {selectedTemplate.content}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        {new Date().toLocaleTimeString('zh-TW')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 提示文案 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">💡 提示：</span>
                這是模擬發送流程。實際開發時，系統將透過 LINE Official Account API 自動發送訊息至該客戶，並記錄發送時間與範本版本。
              </p>
            </div>
          </div>
        ) : (
          /* 成功狀態 */
          <div className="py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">🎉 模擬觸發成功！</h3>
              <p className="text-sm text-slate-600 mt-2">
                已透過 LINE API 發送回訪訊息至「{minsu?.name}」
              </p>
              {selectedTemplate && (
                <Badge className="mt-3 bg-blue-100 text-blue-700 border-0">
                  {selectedTemplate.name}
                </Badge>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!sendSuccess ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                取消
              </Button>
              <Button
                onClick={handleSend}
                disabled={!selectedTemplate || isSending}
                className="gap-2"
                style={selectedTemplate ? { background: 'oklch(0.65 0.22 25)', color: 'white' } : {}}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    確認發送
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

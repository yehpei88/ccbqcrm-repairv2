// 聯繫完成對話框 - 完全按照文件 6.2 和 6.4 的邏輯實現
// 每個通話結果選擇後顯示對應的後續狀態和系統操作

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { type Minsu, type CallResult } from '@/lib/data';
import { AlertCircle, CheckCircle, Clock, XCircle, Phone, AlertTriangle, Search, Calendar } from 'lucide-react';

interface ContactCompleteDialogProps {
  open: boolean;
  minsu: Minsu | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { callResult: CallResult; note: string; followUpDays?: number; lineId?: string; quickTags?: string[]; tagDetails?: Record<string, any> }) => void;
}

// 根據文件 6.4 六主回饋狀態定義後續狀態
const FEEDBACK_STATES: Record<CallResult, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  pinChange: string;
  systemAction: string;
  followUpDays?: number;
  showFollowUpDaysInput?: boolean;
}> = {
  'agreed': {
    label: '✅ 答應加賴',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    pinChange: '紅色 → 綠色',
    systemAction: '觸發 LINE API 自動發送邀請+菜單；流入自動化流程',
    followUpDays: 0,
  },
  'hesitating': {
    label: '🟡 猶豫中',
    icon: <Clock className="w-5 h-5 text-yellow-600" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    pinChange: '維持現狀',
    systemAction: '保留待追；系統自動提醒通知；人員入庫待追',
    followUpDays: 7,
    showFollowUpDaysInput: true,
  },
  'rejected': {
    label: '❌ 拒絕加賴（強烈）',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    pinChange: '維持紅色，大幅降評',
    systemAction: '記錄拒絕；設定 30 天不追蹤；快速篩選；降度評分拒絕',
    followUpDays: 30,
  },
  'invalid': {
    label: '🔴 空號',
    icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    pinChange: '標記空號',
    systemAction: '評估是否應該更新資訊；重新核對資訊（待確認）',
    followUpDays: 0,
  },
  'closed': {
    label: '⭕ 不營業',
    icon: <AlertCircle className="w-5 h-5 text-slate-600" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200',
    pinChange: '標記主動',
    systemAction: '評估停業狀態；不追蹤',
    followUpDays: 0,
  },
  'missed': {
    label: '🟠 未接',
    icon: <Phone className="w-5 h-5 text-orange-500" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 border-orange-200',
    pinChange: '維持現狀，重新排序',
    systemAction: '預設系統自動提醒通知；電話回撥',
    followUpDays: 7,
    showFollowUpDaysInput: true,
  },
};

// 快選標籤配置 - 包含對應動作
const QUICK_TAGS_CONFIG: Record<string, {
  label: string;
  description: string;
  action: 'search' | 'notify' | 'mark' | 'date' | 'text' | 'none';
  actionLabel?: string;
}> = {
  '詢問回饋': {
    label: '詢問回饋',
    description: '客戶詢問其他民宿相關資訊',
    action: 'search',
    actionLabel: '搜尋欄輸入填寫其他民宿名稱',
  },
  '需老闆回覆': {
    label: '需老闆回覆',
    description: '需要老闆親自回覆或處理',
    action: 'notify',
    actionLabel: '標記為需老闆回覆，通知老闆',
  },
  '態度積極': {
    label: '態度積極',
    description: '客戶表現出積極的合作意願',
    action: 'mark',
    actionLabel: '自動標記為高潛力客戶',
  },
  '態度強烈拒絕': {
    label: '態度強烈拒絕',
    description: '客戶明確拒絕合作',
    action: 'mark',
    actionLabel: '自動標記為已拒絕',
  },
  '管多間民宿': {
    label: '管多間民宿',
    description: '同一人管理多間民宿',
    action: 'search',
    actionLabel: '搜尋欄輸入填寫其他民宿名稱',
  },
  '約定回訪日期': {
    label: '約定回訪日期',
    description: '與客戶約定回訪時間',
    action: 'date',
    actionLabel: '設定回訪日期，系統自動提醒',
  },
  '其他': {
    label: '其他',
    description: '其他特殊情況或備註',
    action: 'text',
    actionLabel: '自由文字輸入',
  },
};

export function ContactCompleteDialog({
  open,
  minsu,
  onOpenChange,
  onSave,
}: ContactCompleteDialogProps) {
  const [step, setStep] = useState<'callResult' | 'followUp' | 'lineId' | 'note'>('callResult');
  const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
  const [followUpDays, setFollowUpDays] = useState<number>(7);
  const [lineId, setLineId] = useState('');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagDetails, setTagDetails] = useState<Record<string, any>>({});

  const handleSelectResult = (result: CallResult) => {
    setSelectedResult(result);
    const state = FEEDBACK_STATES[result];
    
    // 如果是「答應加賴」，進入 LINE ID 輸入步驟
    if (result === 'agreed') {
      setStep('lineId');
    } else if (state.showFollowUpDaysInput) {
      // 如果有後續追蹤天數輸入，進入 followUp 步驟
      setFollowUpDays(state.followUpDays || 7);
      setStep('followUp');
    } else {
      // 否則直接進入備注步驟
      setStep('note');
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
      const newDetails = { ...tagDetails };
      delete newDetails[tag];
      setTagDetails(newDetails);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleTagDetailChange = (tag: string, value: any) => {
    setTagDetails({
      ...tagDetails,
      [tag]: value,
    });
  };

  const handleSave = () => {
    if (selectedResult) {
      onSave({
        callResult: selectedResult,
        note,
        followUpDays,
        lineId: selectedResult === 'agreed' ? lineId : undefined,
        quickTags: selectedResult !== 'rejected' ? Array.from(selectedTags) : undefined,
        tagDetails: Object.keys(tagDetails).length > 0 ? tagDetails : undefined,
      });
      // 重置狀態
      setStep('callResult');
      setSelectedResult(null);
      setFollowUpDays(7);
      setLineId('');
      setNote('');
      setSelectedTags(new Set());
      setTagDetails({});
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (step === 'note') {
      const state = FEEDBACK_STATES[selectedResult!];
      if (selectedResult === 'agreed') {
        setStep('lineId');
      } else if (state.showFollowUpDaysInput) {
        setStep('followUp');
      } else {
        setStep('callResult');
      }
    } else if (step === 'followUp') {
      setStep('callResult');
    } else if (step === 'lineId') {
      setStep('callResult');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('callResult');
      setSelectedResult(null);
      setFollowUpDays(7);
      setLineId('');
      setNote('');
      setSelectedTags(new Set());
      setTagDetails({});
    }
    onOpenChange(newOpen);
  };

  if (!minsu) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">聯繫完成 - {minsu.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: 通話結果選擇 */}
          {step === 'callResult' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">Step 1: 選擇通話結果</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FEEDBACK_STATES) as [CallResult, typeof FEEDBACK_STATES[CallResult]][]).map(
                  ([result, state]) => (
                    <button
                      key={result}
                      onClick={() => handleSelectResult(result)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedResult === result
                          ? `${state.bgColor} border-current`
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {state.icon}
                        <span className={`font-semibold text-sm ${state.color}`}>{state.label}</span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 2: LINE ID 輸入（如果是答應加賴） */}
          {step === 'lineId' && selectedResult === 'agreed' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">Step 2: 輸入對方 LINE ID</div>
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-sm text-green-700 mb-4 font-medium">
                  對方已答應加 LINE，請輸入對方的 LINE ID 以便後續自動發送邀請
                </div>
                <input
                  type="text"
                  placeholder="例如：@1234567890 或 user_line_id"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </Card>
            </div>
          )}

          {/* Step 3: 後續追蹤天數設定（如果需要） */}
          {step === 'followUp' && selectedResult && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">Step 3: 設定後續追蹤天數</div>
              <Card className="p-4 bg-slate-50 border-slate-200">
                <div className="text-sm text-slate-600 mb-4 font-medium">
                  {FEEDBACK_STATES[selectedResult].systemAction}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">追蹤天數：</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                  />
                  <span className="text-xs text-slate-500">天後自動提醒</span>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: 備注和快速標籤 */}
          {step === 'note' && selectedResult && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-700">Step 4: 記錄備注</div>

              {/* 後續狀態摘要 */}
              <Card className={`p-4 border-2 ${FEEDBACK_STATES[selectedResult].bgColor}`}>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    {FEEDBACK_STATES[selectedResult].icon}
                    <span className="font-semibold">{FEEDBACK_STATES[selectedResult].label}</span>
                  </div>
                  <div className="border-t border-current border-opacity-20 pt-3">
                    <div>
                      <span className="text-xs font-medium opacity-75">📌 Pin 狀態變更</span>
                      <p className="font-semibold mt-1">
                        {FEEDBACK_STATES[selectedResult].pinChange}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-current border-opacity-20 pt-3">
                    <div>
                      <span className="text-xs font-medium opacity-75">⚙️ 系統自動執行</span>
                      <p className="font-semibold mt-1">
                        {FEEDBACK_STATES[selectedResult].systemAction}
                      </p>
                    </div>
                  </div>
                  {selectedResult !== 'rejected' &&
                    FEEDBACK_STATES[selectedResult].followUpDays !== undefined &&
                    FEEDBACK_STATES[selectedResult].followUpDays > 0 && (
                      <div className="border-t border-current border-opacity-20 pt-3">
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          ⏰ {followUpDays} 天後自動提醒
                        </Badge>
                      </div>
                    )}
                </div>
              </Card>

              {/* 快速標籤 - 拒絕加賴時不顯示 */}
              {selectedResult !== 'rejected' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 block">快速標籤（可複選）</label>
                  <div className="space-y-2">
                    {Object.entries(QUICK_TAGS_CONFIG).map(([tagKey, tagConfig]) => (
                      <div key={tagKey} className="space-y-2">
                        <button
                          onClick={() => handleTagToggle(tagKey)}
                          className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-all ${
                            selectedTags.has(tagKey)
                              ? 'bg-blue-50 border-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${selectedTags.has(tagKey) ? 'text-blue-700' : 'text-slate-700'}`}>
                                {tagConfig.label}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">{tagConfig.description}</div>
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded ${
                              selectedTags.has(tagKey)
                                ? 'bg-blue-200 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {selectedTags.has(tagKey) ? '✓' : '○'}
                            </div>
                          </div>
                        </button>

                        {/* 標籤對應的互動欄位 */}
                        {selectedTags.has(tagKey) && (
                          <div className="ml-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                            {tagConfig.action === 'search' && (
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">
                                  <Search className="w-3 h-3 inline mr-1" />
                                  {tagConfig.actionLabel}
                                </label>
                                <input
                                  type="text"
                                  placeholder="輸入民宿名稱（多個用逗號分隔）"
                                  value={tagDetails[tagKey] || ''}
                                  onChange={(e) => handleTagDetailChange(tagKey, e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                            )}
                            {tagConfig.action === 'notify' && (
                              <div className="text-xs text-slate-600">
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  🔔 {tagConfig.actionLabel}
                                </Badge>
                              </div>
                            )}
                            {tagConfig.action === 'mark' && (
                              <div className="text-xs text-slate-600">
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  ✓ {tagConfig.actionLabel}
                                </Badge>
                              </div>
                            )}
                            {tagConfig.action === 'date' && (
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {tagConfig.actionLabel}
                                </label>
                                <input
                                  type="date"
                                  value={tagDetails[tagKey] || ''}
                                  onChange={(e) => handleTagDetailChange(tagKey, e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                            )}
                            {tagConfig.action === 'text' && (
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">
                                  {tagConfig.actionLabel}
                                </label>
                                <input
                                  type="text"
                                  placeholder="輸入備註內容"
                                  value={tagDetails[tagKey] || ''}
                                  onChange={(e) => handleTagDetailChange(tagKey, e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 備注欄 */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">自由文字備注</label>
                <Textarea
                  placeholder="記錄通話內容、客戶反應、特殊需求等..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-24 text-sm"
                />
              </div>
            </div>
          )}

          {/* 按鈕組 */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
            {step !== 'callResult' && (
              <Button variant="outline" onClick={handleBack}>
                上一步
              </Button>
            )}
            {step !== 'note' && (
              <Button
                onClick={() => {
                  if (step === 'callResult' && selectedResult) {
                    handleSelectResult(selectedResult);
                  } else if (step === 'lineId' && selectedResult === 'agreed') {
                    setStep('note');
                  } else if (step === 'followUp') {
                    setStep('note');
                  }
                }}
                disabled={!selectedResult || (step === 'lineId' && !lineId.trim())}
              >
                下一步
              </Button>
            )}
            {step === 'note' && (
              <Button onClick={handleSave} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                確認保存
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

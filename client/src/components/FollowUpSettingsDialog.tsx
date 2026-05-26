import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';

interface FollowUpSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDays: number;
  onSave: (days: number) => void;
}

export function FollowUpSettingsDialog({
  open,
  onOpenChange,
  currentDays,
  onSave,
}: FollowUpSettingsDialogProps) {
  const [days, setDays] = useState(currentDays);

  const handleSave = () => {
    onSave(days);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            系統回訪參數設定
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 回訪間隔設定 */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-4">
              紫標客戶回訪間隔 (天)
            </label>
            <div className="space-y-4">
              {/* 滑塊 */}
              <div className="flex items-center gap-4">
                <Slider
                  value={[days]}
                  onValueChange={(value) => setDays(value[0])}
                  min={30}
                  max={180}
                  step={10}
                  className="flex-1"
                />
                <div className="text-2xl font-bold text-purple-700 w-16 text-right">
                  {days}
                </div>
              </div>

              {/* 預設值快捷按鈕 */}
              <div className="flex gap-2">
                {[30, 60, 90, 180].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setDays(preset)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all ${
                      days === preset
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {preset}天
                  </button>
                ))}
              </div>
            </div>

            {/* 說明文案 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">💡 說明：</span>
                系統將在客戶距離上次合作超過此天數時，自動在 VIP 列表中標記為「⚠️ 建議回訪」，提醒您主動聯繫該客戶。
              </p>
            </div>
          </div>

          {/* 建議值說明 */}
          <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800">📊 建議設定值：</p>
            <ul className="text-xs text-amber-700 space-y-1 ml-3">
              <li>• <span className="font-medium">30 天</span> - 高頻互動客戶，需要密集跟進</li>
              <li>• <span className="font-medium">60 天</span> - 標準設定，適合大多數 VIP 客戶</li>
              <li>• <span className="font-medium">90 天</span> - 季度回訪，適合低頻客戶</li>
              <li>• <span className="font-medium">180 天</span> - 半年回訪，長期維護客戶</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            style={{ background: 'oklch(0.65 0.22 25)', color: 'white' }}
          >
            儲存設定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

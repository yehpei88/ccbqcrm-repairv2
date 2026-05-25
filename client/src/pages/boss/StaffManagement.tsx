// 工讀生帳號管理頁面
// 功能：新增工讀生、停用/啟用帳號、查看工讀生列表

import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MOCK_STAFF } from '@/lib/data';
import type { Staff } from '@/lib/data';
import { Plus, Trash2, Power, Users, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffWithStatus extends Staff {
  status: 'active' | 'inactive';
  lastActivity?: string;
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<StaffWithStatus[]>(
    MOCK_STAFF.map(staff => ({
      ...staff,
      status: 'active' as const,
      lastActivity: '2026-05-23 14:30',
    }))
  );
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddStaff = () => {
    if (!newStaffName.trim()) {
      toast.error('請輸入工讀生名稱');
      return;
    }

    const newStaff: StaffWithStatus = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      assignedAreas: [],
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      lastActivity: new Date().toLocaleString('zh-TW'),
    };

    setStaffList([...staffList, newStaff]);
    toast.success(`已新增工讀生：${newStaffName}`);
    setNewStaffName('');
    setIsAddDialogOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setStaffList(prev =>
      prev.map(staff =>
        staff.id === id
          ? {
              ...staff,
              status: staff.status === 'active' ? 'inactive' : 'active',
              lastActivity: new Date().toLocaleString('zh-TW'),
            }
          : staff
      )
    );

    const staff = staffList.find(s => s.id === id);
    const newStatus = staff?.status === 'active' ? '停用' : '啟用';
    toast.success(`已${newStatus}工讀生：${staff?.name}`);
  };

  const handleDeleteStaff = (id: string) => {
    const staff = staffList.find(s => s.id === id);
    setStaffList(prev => prev.filter(s => s.id !== id));
    toast.success(`已刪除工讀生：${staff?.name}`);
    setConfirmDeleteId(null);
  };

  const activeCount = staffList.filter(s => s.status === 'active').length;
  const inactiveCount = staffList.filter(s => s.status === 'inactive').length;

  return (
    <Layout role="boss">
      <PageHeader
        title="工讀生帳號管理"
        subtitle="新增・停用・管理顧客開發人員帳號"
      />

      <div className="p-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">總工讀生數</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{staffList.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">啟用中</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                <Power size={20} className="text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">已停用</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{inactiveCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-200 flex items-center justify-center">
                <AlertCircle size={20} className="text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* 新增按鈕 */}
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ background: 'oklch(0.28 0.09 250)', color: 'white' }}>
                <Plus size={18} />
                新增工讀生
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新增工讀生帳號</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staffName" className="text-sm font-medium">
                    工讀生名稱 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="staffName"
                    placeholder="例如：小陳、小林"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStaff()}
                    className="mt-2"
                  />
                </div>
                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  <p>💡 新增後可在「區域分配設定」頁面為工讀生指派負責區域</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleAddStaff}
                    className="flex-1"
                    style={{ background: 'oklch(0.28 0.09 250)', color: 'white' }}
                  >
                    確認新增
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 工讀生列表 */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">工讀生列表</h3>
            <p className="text-xs text-muted-foreground mt-1">共 {staffList.length} 位工讀生</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">名稱</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">狀態</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">負責區域</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">建檔日期</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">最後活動</th>
                  <th className="text-center px-6 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{staff.name}</td>
                    <td className="px-6 py-4">
                      <Badge
                        className={cn(
                          'border-0',
                          staff.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {staff.status === 'active' ? '✓ 啟用中' : '✗ 已停用'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {staff.assignedAreas.length > 0
                        ? `${staff.assignedAreas.length} 個區域`
                        : '未分配'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {staff.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {staff.lastActivity || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(staff.id)}
                          className={cn(
                            'h-8 px-3',
                            staff.status === 'active'
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          )}
                        >
                          <Power size={14} />
                          <span className="ml-1 text-xs">
                            {staff.status === 'active' ? '停用' : '啟用'}
                          </span>
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDeleteId(staff.id)}
                            >
                              <Trash2 size={14} />
                              <span className="ml-1 text-xs">刪除</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>確認刪除</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-foreground">
                                確定要刪除工讀生「<strong>{staff.name}</strong>」嗎？
                              </p>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs text-red-700">
                                  ⚠️ 此操作無法復原，該工讀生的所有資料將被刪除
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1"
                                >
                                  取消
                                </Button>
                                <Button
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                  確認刪除
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {staffList.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">還沒有工讀生，點擊「新增工讀生」開始添加</p>
            </div>
          )}
        </div>


      </div>
    </Layout>
  );
}

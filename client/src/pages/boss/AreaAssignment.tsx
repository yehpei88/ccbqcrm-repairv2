import { useState } from 'react';
import Layout, { PageHeader } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MOCK_STAFF, AVAILABLE_AREAS, AREA_ASSIGNMENTS } from '@/lib/data';
import type { Staff, AreaAssignment } from '@/lib/data';
import { Users, MapPin } from 'lucide-react';

export default function AreaAssignment() {
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
  const [assignments, setAssignments] = useState<AreaAssignment[]>(AREA_ASSIGNMENTS);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const handleEditClick = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setSelectedAreas(staff.assignedAreas);
  };

  const handleAreaToggle = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleSaveAssignment = () => {
    if (!editingStaffId || selectedAreas.length === 0) {
      toast.error('請選擇至少一個區域');
      return;
    }

    const staff = staffList.find(s => s.id === editingStaffId);
    if (!staff) return;

    // 更新 staffList
    setStaffList(prev =>
      prev.map(s =>
        s.id === editingStaffId ? { ...s, assignedAreas: selectedAreas } : s
      )
    );

    // 更新 assignments
    setAssignments(prev => {
      const existing = prev.findIndex(a => a.staffId === editingStaffId);
      if (existing >= 0) {
        return prev.map((a, i) =>
          i === existing
            ? { ...a, areas: selectedAreas, assignedAt: new Date().toISOString().split('T')[0] }
            : a
        );
      }
      return [
        ...prev,
        {
          staffId: editingStaffId,
          staffName: staff.name,
          areas: selectedAreas,
          assignedAt: new Date().toISOString().split('T')[0],
        },
      ];
    });

    toast.success(`已為 ${staff.name} 更新區域分配`);
    setEditingStaffId(null);
  };

  const totalAssignedAreas = assignments.reduce((sum, a) => sum + a.areas.length, 0);
  const unassignedStaff = staffList.filter(s => !assignments.find(a => a.staffId === s.id)).length;

  return (
    <Layout role="boss">
      <PageHeader
        title="工讀生區域分配"
        subtitle="為工讀生指派特定區域，防止多人搶同一筆客戶資料"
      />

      <div className="p-6 space-y-6">
        {/* 工讀生列表 */}
        <div className="grid gap-4">
          {staffList.map(staff => {
            const assignment = assignments.find(a => a.staffId === staff.id);
            return (
              <Card key={staff.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-blue-600" />
                      <h3 className="font-semibold text-lg text-foreground">{staff.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin size={14} className="text-orange-500" />
                      負責區域：{assignment?.areas.join('、') || '未分配'}
                    </p>
                    {assignment && (
                      <p className="text-xs text-muted-foreground">
                        最後更新：{assignment.assignedAt}
                      </p>
                    )}
                  </div>
                  <Dialog open={editingStaffId === staff.id} onOpenChange={(open) => {
                    if (!open) setEditingStaffId(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => handleEditClick(staff)}
                        className="flex-shrink-0"
                      >
                        編輯區域
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>為 {staff.name} 分配區域</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {AVAILABLE_AREAS.map(area => (
                          <div key={area} className="flex items-center space-x-2">
                            <Checkbox
                              id={area}
                              checked={selectedAreas.includes(area)}
                              onCheckedChange={() => handleAreaToggle(area)}
                            />
                            <Label htmlFor={area} className="cursor-pointer text-sm">
                              {area}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditingStaffId(null)}
                          className="flex-1"
                        >
                          取消
                        </Button>
                        <Button onClick={handleSaveAssignment} className="flex-1">
                          保存分配
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 分配統計 */}
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="font-semibold text-foreground mb-3">分配統計</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">總工讀生數</p>
              <p className="text-2xl font-bold text-blue-600">{staffList.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">已分配區域</p>
              <p className="text-2xl font-bold text-green-600">{totalAssignedAreas}/{AVAILABLE_AREAS.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">未分配工讀生</p>
              <p className="text-2xl font-bold text-orange-600">{unassignedStaff}</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}

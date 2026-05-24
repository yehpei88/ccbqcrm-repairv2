// CC 代客烤肉 CRM 系統 — 登入頁面
// 設計：深藍漸層背景 + 白色登入卡片，品牌橙色強調

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Flame, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { STAFF_LOGIN_CREDENTIALS } from '@/lib/data';

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role: 'boss' | 'staff') => {
    if (!username || !password) {
      toast.error('請輸入帳號與密碼');
      return;
    }

    if (role === 'boss') {
      // 老闆登入（簡化版，直接進入）
      if (username === 'boss' && password === 'boss123') {
        // 存儲登入狀態到 localStorage
        localStorage.setItem('userRole', 'boss');
        localStorage.setItem('username', 'boss');
        setLocation('/boss/dashboard');
      } else {
        toast.error('老闆帳號或密碼錯誤');
      }
    } else {
      // 顧客開發人員登入驗證
      const staff = STAFF_LOGIN_CREDENTIALS.find(
        s => s.username === username && s.password === password
      );
      
      if (staff) {
        // 存儲登入狀態到 localStorage
        localStorage.setItem('userRole', 'staff');
        localStorage.setItem('staffId', staff.staffId);
        localStorage.setItem('staffName', staff.staffName);
        localStorage.setItem('assignedAreas', JSON.stringify(staff.assignedAreas));
        setLocation('/staff/map');
      } else {
        toast.error('顧客開發人員帳號或密碼錯誤');
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, oklch(0.14 0.07 250) 0%, oklch(0.20 0.08 250) 50%, oklch(0.16 0.06 240) 100%)',
      }}
    >
      {/* 背景圖片 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663650802566/8cnSCsr4Ssiiv4CSTK8DPa/crm-login-bg-FPrhhwcVGuMqXgD86mJzPV.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 裝飾圓形 */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'oklch(0.65 0.22 25)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'oklch(0.55 0.18 250)', filter: 'blur(50px)' }} />

      {/* 登入卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* 品牌標題 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: 'oklch(0.65 0.22 25)' }}>
            <Flame size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CC 代客烤肉</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.72 0.05 250)' }}>
            CRM 通路開發管理系統
          </p>
        </div>

        {/* 登入表單卡片 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6">
            <h2 className="text-lg font-bold text-foreground mb-6">登入系統</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">帳號</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="請輸入帳號"
                    className="pl-9"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">密碼</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="請輸入密碼"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin('boss')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 登入按鈕區 */}
          <div className="px-8 pb-8 space-y-3">
            <Button
              className="w-full h-11 font-semibold text-base shadow-md"
              style={{ background: 'oklch(0.28 0.09 250)', color: 'white' }}
              onClick={() => handleLogin('boss')}
            >
              👑 老闆登入
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 font-semibold text-base"
              onClick={() => handleLogin('staff')}
            >
              💼 顧客開發人員登入
            </Button>
          </div>

          {/* 提示 */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-muted-foreground">
              歐宜喜有限公司 · CC 代客烤肉 © 2026
            </p>
          </div>
        </div>

        {/* 快速入口（雛形用） */}
        <div className="mt-6 text-center">
          <p className="text-xs mb-3" style={{ color: 'oklch(0.65 0.04 250)' }}>介面雛形快速入口</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: 'oklch(0.40 0.07 250)', color: 'oklch(0.78 0.05 250)' }}
              onClick={() => {
                localStorage.setItem('userRole', 'boss');
                setLocation('/boss/dashboard');
              }}
            >
              老闆 - 儀表板
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: 'oklch(0.40 0.07 250)', color: 'oklch(0.78 0.05 250)' }}
              onClick={() => {
                localStorage.setItem('userRole', 'boss');
                setLocation('/boss/vip');
              }}
            >
              老闆 - VIP 管理
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: 'oklch(0.40 0.07 250)', color: 'oklch(0.78 0.05 250)' }}
              onClick={() => {
                localStorage.setItem('userRole', 'staff');
                localStorage.setItem('staffId', 'staff-1');
                localStorage.setItem('staffName', '小陳');
                localStorage.setItem('assignedAreas', JSON.stringify(['礁溪鄉', '員山鄉', '壯圍鄉']));
                setLocation('/staff/map');
              }}
            >
              顧客開發人員 - 地圖（小陳）
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: 'oklch(0.40 0.07 250)', color: 'oklch(0.78 0.05 250)' }}
              onClick={() => {
                localStorage.setItem('userRole', 'staff');
                localStorage.setItem('staffId', 'staff-2');
                localStorage.setItem('staffName', '小林');
                localStorage.setItem('assignedAreas', JSON.stringify(['冬山鄉', '羅東鎮', '三星鄉']));
                setLocation('/staff/map');
              }}
            >
              顧客開發人員 - 地圖（小林）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

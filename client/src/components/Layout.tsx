// CC 代客烤肉 CRM 系統 — 共用佈局元件
// 設計：深藍側欄 (#1E3A5F) + 白底主內容區，現代企業 CRM 風格

import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Map, Star, Bell, Tag, Phone,
  FileText, LogOut, ChevronLeft, ChevronRight,
  Flame, Users, BarChart3, Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  role: 'boss' | 'staff' | 'both';
}

const BOSS_NAV: NavItem[] = [
  { path: '/boss/dashboard', icon: <LayoutDashboard size={18} />, label: '營運儀表板', role: 'boss' },
  { path: '/boss/vip', icon: <Star size={18} />, label: 'VIP 管理', role: 'boss' },
  { path: '/boss/map', icon: <Map size={18} />, label: '地圖全覽', role: 'boss' },
  { path: '/boss/alerts', icon: <Bell size={18} />, label: 'AI 意向警示', badge: 2, role: 'boss' },
  { path: '/boss/pricing', icon: <Tag size={18} />, label: '定價建議', badge: 2, role: 'boss' },
  { path: '/boss/staff-record', icon: <BarChart3 size={18} />, label: '銷售人員紀錄', role: 'boss' },
  { path: '/boss/performance', icon: <BarChart3 size={18} />, label: '績效管理報表', role: 'boss' },
];

const STAFF_NAV: NavItem[] = [
  { path: '/staff/map', icon: <Map size={18} />, label: '地圖作業', role: 'staff' },
  { path: '/staff/call', icon: <Phone size={18} />, label: '撥號登錄', role: 'staff' },
  { path: '/staff/detail', icon: <FileText size={18} />, label: '客戶備注', role: 'staff' },
];

interface LayoutProps {
  children: React.ReactNode;
  role: 'boss' | 'staff';
}

export default function Layout({ children, role }: LayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = role === 'boss' ? BOSS_NAV : STAFF_NAV;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 側欄 */}
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out flex-shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
        style={{ background: 'oklch(0.18 0.07 250)' }}
      >
        {/* 品牌 Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'oklch(0.28 0.07 250)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'oklch(0.65 0.22 25)' }}>
            <Flame size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-tight">CC 代客烤肉</div>
              <div className="text-xs" style={{ color: 'oklch(0.65 0.05 250)' }}>CRM 系統</div>
            </div>
          )}
        </div>

        {/* 角色標示 */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: 'oklch(0.25 0.07 250)', color: 'oklch(0.78 0.12 250)' }}>
              {role === 'boss' ? '👑 老闆管理介面' : '💼 顧客開發人員作業介面'}
            </div>
          </div>
        )}

        {/* 導覽選單 */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path || location.startsWith(item.path + '/');
            return (
              <Link key={item.path} href={item.path}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'text-white shadow-md'
                    : 'hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                  style={{
                    background: isActive ? 'oklch(0.55 0.18 250)' : 'transparent',
                    color: isActive ? 'white' : 'oklch(0.72 0.04 250)',
                    boxShadow: isActive ? '0 2px 8px oklch(0.55 0.18 250 / 0.4)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'oklch(0.25 0.07 250)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge className="text-xs px-1.5 py-0 h-5 bg-red-500 text-white border-0">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 切換角色 & 登出 */}
        <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: 'oklch(0.28 0.07 250)' }}>
          {!collapsed && (
            <Link href="/">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ color: 'oklch(0.72 0.04 250)' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'oklch(0.25 0.07 250)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <Users size={18} />
                <span>切換角色</span>
              </div>
            </Link>
          )}
          <Link href="/">
            <div className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              collapsed && 'justify-center px-2'
            )}
              style={{ color: 'oklch(0.72 0.04 250)' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'oklch(0.25 0.07 250)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              <LogOut size={18} />
              {!collapsed && <span>登出</span>}
            </div>
          </Link>
        </div>

        {/* 收合按鈕 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10 transition-colors"
          style={{ background: 'oklch(0.55 0.18 250)', color: 'white' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto bg-background relative">
        {children}
      </main>
    </div>
  );
}

// 頁面標題元件
export function PageHeader({
  title, subtitle, actions
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

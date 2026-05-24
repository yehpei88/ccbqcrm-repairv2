// CC 代客烤肉 CRM 系統 — 權限防護元件
// 設計：防止未授權操作，顯示權限不足提示

import { usePermissions, type Permissions } from '@/hooks/usePermissions';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionGuardProps {
  role: 'boss' | 'staff';
  permission: keyof Permissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onDenied?: () => void;
}

/**
 * 權限防護元件 - 根據權限顯示或隱藏內容
 */
export function PermissionGuard({
  role,
  permission,
  children,
  fallback,
  onDenied,
}: PermissionGuardProps) {
  const permissions = usePermissions(role);
  const hasPermission = permissions[permission];

  if (!hasPermission) {
    if (onDenied) {
      onDenied();
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

/**
 * 權限防護按鈕 - 根據權限啟用或禁用按鈕
 */
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  role: 'boss' | 'staff';
  permission: keyof Permissions;
  children: React.ReactNode;
}

export function ProtectedButton({
  role,
  permission,
  children,
  onClick,
  ...props
}: ProtectedButtonProps) {
  const permissions = usePermissions(role);
  const hasPermission = permissions[permission];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasPermission) {
      toast.error('您沒有權限執行此操作');
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      disabled={!hasPermission || props.disabled}
      onClick={handleClick}
      title={!hasPermission ? '您沒有權限執行此操作' : undefined}
    >
      {children}
    </button>
  );
}

/**
 * 權限不足提示元件
 */
export function PermissionDeniedAlert() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
      <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
      <div>
        <p className="font-semibold text-red-900">權限不足</p>
        <p className="text-sm text-red-700">您沒有權限訪問此頁面或執行此操作。如有需要，請聯繫系統管理員。</p>
      </div>
    </div>
  );
}

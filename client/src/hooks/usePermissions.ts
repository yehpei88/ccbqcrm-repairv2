// CC 代客烤肉 CRM 系統 — 權限控管 Hook
// 設計：區分老闆與顧客開發人員的操作權限

import { useLocation } from 'wouter';

export interface Permissions {
  // 老闆專屬權限
  canViewDashboard: boolean;
  canManageVIP: boolean;
  canViewAllMap: boolean;
  canViewAlerts: boolean;
  canManagePricing: boolean;
  canViewStaffRecord: boolean;
  canViewPerformanceReport: boolean;
  canEditPinStatus: boolean;
  canSendMessages: boolean;
  canManageDiscounts: boolean;
  
  // 顧客開發人員權限
  canViewOwnMap: boolean;
  canLogCalls: boolean;
  canViewCustomerDetail: boolean;
  canEditOwnNotes: boolean;
  
  // 限制操作
  canDeleteData: boolean;
  canExportData: boolean;
  canModifySystemSettings: boolean;
}

export function usePermissions(role: 'boss' | 'staff'): Permissions {
  const [location] = useLocation();
  
  const bossPermissions: Permissions = {
    // 老闆可以訪問所有功能
    canViewDashboard: true,
    canManageVIP: true,
    canViewAllMap: true,
    canViewAlerts: true,
    canManagePricing: true,
    canViewStaffRecord: true,
    canViewPerformanceReport: true,
    canEditPinStatus: true,
    canSendMessages: true,
    canManageDiscounts: true,
    
    // 顧客開發人員功能
    canViewOwnMap: true,
    canLogCalls: true,
    canViewCustomerDetail: true,
    canEditOwnNotes: true,
    
    // 限制操作
    canDeleteData: true,
    canExportData: true,
    canModifySystemSettings: true,
  };
  
  const staffPermissions: Permissions = {
    // 老闆專屬功能 - 禁止
    canViewDashboard: false,
    canManageVIP: false,
    canViewAllMap: false,
    canViewAlerts: false,
    canManagePricing: false,
    canViewStaffRecord: false,
    canViewPerformanceReport: false,
    canEditPinStatus: false,
    canSendMessages: false,
    canManageDiscounts: false,
    
    // 顧客開發人員功能 - 允許
    canViewOwnMap: true,
    canLogCalls: true,
    canViewCustomerDetail: true,
    canEditOwnNotes: true,
    
    // 限制操作 - 禁止
    canDeleteData: false,
    canExportData: false,
    canModifySystemSettings: false,
  };
  
  return role === 'boss' ? bossPermissions : staffPermissions;
}

/**
 * 檢查是否有特定權限，如果沒有則顯示警告
 */
export function checkPermission(permissions: Permissions, action: keyof Permissions): boolean {
  const hasPermission = permissions[action];
  
  if (!hasPermission) {
    console.warn(`Permission denied for action: ${action}`);
  }
  
  return hasPermission;
}

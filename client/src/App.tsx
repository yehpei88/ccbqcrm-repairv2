// CC 代客烤肉 CRM 系統 — 路由設定
// 設計：現代商業 CRM，深藍側欄 + 白底主內容區
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
// 登入頁
import Login from "./pages/Login";
// 老闆頁面
import Dashboard from "./pages/boss/Dashboard";
import VipManagement from "./pages/boss/VipManagement";
import BossMap from "./pages/boss/BossMap";
import AlertsPage from "./pages/boss/AlertsPage";
import PricingPage from "./pages/boss/PricingPage";
import StaffWorkRecord from "./pages/boss/StaffWorkRecord";
import PerformanceReport from "./pages/boss/PerformanceReport";
import AreaAssignment from "./pages/boss/AreaAssignment";
import BossCustomerDetail from "./pages/boss/BossCustomerDetail";
// 顧客開發人員頁面
import StaffMap from "./pages/staff/StaffMap";
import CallLog from "./pages/staff/CallLog";
import CustomerDetail from "./pages/staff/CustomerDetail";
import NotFound from "./pages/NotFound";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* 登入 */}
      <Route path="/" component={Login} />
      {/* 老闆介面 */}
      <Route path="/boss/dashboard" component={Dashboard} />
      <Route path="/boss/vip" component={VipManagement} />
      <Route path="/boss/map" component={BossMap} />
      <Route path="/boss/alerts" component={AlertsPage} />
      <Route path="/boss/pricing" component={PricingPage} />
      <Route path="/boss/staff-record" component={StaffWorkRecord} />
      <Route path="/boss/performance" component={PerformanceReport} />
      <Route path="/boss/area-assignment" component={AreaAssignment} />
      <Route path="/boss/customer-detail" component={BossCustomerDetail} />
      {/* 顧客開發人員介面 */}
      <Route path="/staff/map" component={StaffMap} />
      <Route path="/staff/call" component={CallLog} />
      <Route path="/staff/detail" component={CustomerDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

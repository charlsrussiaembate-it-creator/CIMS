import { useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ComputersPage from "./pages/ComputersPage";
import ProblemsPage from "./pages/ProblemsPage";
import MaintenancePage from "./pages/MaintenancePage";
import HistoryPage from "./pages/HistoryPage";
import AuditLogPage from "./pages/AuditLogPage";
import StaffReportPage from "./pages/StaffReportPage";
import StaffComputerStatusPage from "./pages/StaffComputerStatusPage";
import StaffMaintenanceStatusPage from "./pages/StaffMaintenanceStatusPage";
import LoginPage from "./pages/LoginPage";
import { initialData, generateId, nowTimestamp } from "./data";
import type { AppData, AuditLog } from "./data";

export type AdminPage = "dashboard" | "computers" | "problems" | "maintenance" | "history" | "audit";
export type StaffPage = "dashboard" | "report" | "my-problems" | "computer-status" | "maintenance-status";
export type UserRole = "admin" | "staff";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>("admin");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [staffPage, setStaffPage] = useState<StaffPage>("dashboard");
  const [data, setData] = useState<AppData>(initialData);

  const addLog = useCallback((role: UserRole, actor: string, action: string, details: string) => {
    setData(prev => {
      const id = generateId("LOG", prev.auditLogs);
      const log: AuditLog = { id, timestamp: nowTimestamp(), role, actor, action, details };
      return { ...prev, auditLogs: [log, ...prev.auditLogs] };
    });
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={nextRole => { setRole(nextRole); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="flex h-full">
      <Sidebar
        role={role}
        setRole={setRole}
        adminPage={adminPage}
        setAdminPage={setAdminPage}
        staffPage={staffPage}
        setStaffPage={setStaffPage}
      />
      <main className="flex-1 overflow-y-auto bg-[#0f172a]">
        {role === "admin" ? (
          <>
            {adminPage === "dashboard" && <AdminDashboard data={data} setPage={setAdminPage} />}
            {adminPage === "computers" && <ComputersPage data={data} setData={setData} addLog={addLog} />}
            {adminPage === "problems" && <ProblemsPage data={data} setData={setData} role="admin" addLog={addLog} />}
            {adminPage === "maintenance" && <MaintenancePage data={data} setData={setData} addLog={addLog} />}
            {adminPage === "history" && <HistoryPage data={data} />}
            {adminPage === "audit" && <AuditLogPage data={data} />}
          </>
        ) : (
          <>
            {staffPage === "dashboard" && <StaffDashboard data={data} setPage={setStaffPage} />}
            {staffPage === "report" && <StaffReportPage data={data} setData={setData} setPage={setStaffPage} addLog={addLog} />}
            {staffPage === "my-problems" && <ProblemsPage data={data} setData={setData} role="staff" addLog={addLog} />}
            {staffPage === "computer-status" && <StaffComputerStatusPage data={data} />}
            {staffPage === "maintenance-status" && <StaffMaintenanceStatusPage data={data} />}
          </>
        )}
      </main>
    </div>
  );
}

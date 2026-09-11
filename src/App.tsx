import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
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
import DevTool from "./components/DevTool";
import { initialData, generateId, nowTimestamp } from "./data";
import type { AppData, AuditLog } from "./data";
import { api } from "./api";

export type AdminPage = "dashboard" | "computers" | "problems" | "maintenance" | "history" | "audit";
export type StaffPage = "dashboard" | "report" | "my-problems" | "computer-status" | "maintenance-status";
export type UserRole = "admin" | "staff";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>("admin");
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard");
  const [staffPage, setStaffPage] = useState<StaffPage>("dashboard");
  const [computerLocationFilter, setComputerLocationFilter] = useState<string>("All");
  const [data, setData] = useState<AppData>(initialData);

  useEffect(() => {
    localStorage.setItem("cims-theme", "light");
    document.documentElement.classList.add("theme-light");
    document.documentElement.classList.remove("theme-dark");
  }, []);

  const loadData = useCallback(async () => {
    try {
      const fetched = await api.fetchAllData();
      if (fetched && fetched.computers && fetched.problems) {
        setData(fetched);
      }
    } catch (err) {
      console.warn("Could not connect to database, using cached/local data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, isAuthenticated]);

  const addLog = useCallback((role: UserRole, actor: string, action: string, details: string) => {
    setData(prev => {
      const id = generateId("LOG", prev.auditLogs);
      const log: AuditLog = { id, timestamp: nowTimestamp(), role, actor, action, details };
      // Asynchronously persist to database
      api.createAuditLog(log).catch(err => {
        console.warn("Failed to persist audit log to DB:", err);
      });
      return { ...prev, auditLogs: [log, ...prev.auditLogs] };
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f5f5f7]">
      {!isAuthenticated ? (
        <div className="auth-view-enter min-h-screen bg-[#f5f5f7]">
          <LoginPage
            onLogin={nextRole => {
              setRole(nextRole);
              setIsAuthenticated(true);
            }}
          />
        </div>
      ) : (
        <div className="cims-app auth-view-enter flex flex-col h-screen overflow-hidden">
          <Header
            role={role}
            adminPage={adminPage}
            staffPage={staffPage}
            computerLocationFilter={computerLocationFilter}
            setComputerLocationFilter={setComputerLocationFilter}
            onLogout={() => setIsAuthenticated(false)}
          />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              role={role}
              adminPage={adminPage}
              setAdminPage={setAdminPage}
              staffPage={staffPage}
              setStaffPage={setStaffPage}
              data={data}
              computerLocationFilter={computerLocationFilter}
              setComputerLocationFilter={setComputerLocationFilter}
            />
            <main className="flex-1 overflow-y-auto bg-[#f8fafc] text-slate-900">
              <div key={role === "admin" ? adminPage : staffPage} className="page-enter">
                {role === "admin" ? (
                  <>
                    {adminPage === "dashboard" && (
                      <AdminDashboard
                        data={data}
                        setPage={setAdminPage}
                      />
                    )}
                    {adminPage === "computers" && (
                      <ComputersPage
                        data={data}
                        setData={setData}
                        addLog={addLog}
                        activeLocationFilter={computerLocationFilter}
                        setActiveLocationFilter={setComputerLocationFilter}
                      />
                    )}
                    {adminPage === "problems" && <ProblemsPage data={data} setData={setData} role="admin" addLog={addLog} />}
                    {adminPage === "maintenance" && <MaintenancePage data={data} setData={setData} addLog={addLog} />}
                    {adminPage === "history" && <HistoryPage data={data} />}
                    {adminPage === "audit" && <AuditLogPage data={data} />}
                  </>
                ) : (
                  <>
                    {staffPage === "dashboard" && (
                      <StaffDashboard
                        data={data}
                        setPage={setStaffPage}
                      />
                    )}
                    {staffPage === "report" && <StaffReportPage data={data} setData={setData} setPage={setStaffPage} addLog={addLog} />}
                    {staffPage === "my-problems" && <ProblemsPage data={data} setData={setData} role="staff" addLog={addLog} />}
                    {staffPage === "computer-status" && <StaffComputerStatusPage data={data} />}
                    {staffPage === "maintenance-status" && <StaffMaintenanceStatusPage data={data} />}
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Global Floating DevTool - Accessible on Login Page and in App */}
      <DevTool
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        role={role}
        setRole={setRole}
      />
    </div>
  );
}

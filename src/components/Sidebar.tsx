import type { AdminPage, StaffPage, UserRole } from "../App";
import type { AppData } from "../data";
import { AppIcon } from "./Icons";

interface SidebarProps {
  role: UserRole;
  adminPage: AdminPage;
  setAdminPage: (p: AdminPage) => void;
  staffPage: StaffPage;
  setStaffPage: (p: StaffPage) => void;
  data?: AppData;
  computerLocationFilter?: string;
  setComputerLocationFilter?: (loc: string) => void;
}

const adminNav: { id: AdminPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "computers", label: "Computers", icon: "computers" },
  { id: "problems", label: "Problems", icon: "problems" },
  { id: "maintenance", label: "Maintenance", icon: "maintenance" },
  { id: "history", label: "History", icon: "history" },
  { id: "audit", label: "Audit Log", icon: "audit" },
];

const staffNav: { id: StaffPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "dashboard" },
  { id: "report", label: "Report Problem", icon: "plus" },
  { id: "my-problems", label: "View Problems", icon: "problems" },
  { id: "computer-status", label: "Computer Status", icon: "computers" },
  { id: "maintenance-status", label: "Maintenance Status", icon: "maintenance" },
];

export default function Sidebar({
  role,
  adminPage,
  setAdminPage,
  staffPage,
  setStaffPage,
  data,
  setComputerLocationFilter,
}: SidebarProps) {
  const currentPage = role === "admin" ? adminPage : staffPage;
  const nav = role === "admin" ? adminNav : staffNav;

  const openProblemsCount = data?.problems.filter(p => p.status === "Open" || p.status === "In Progress").length || 0;
  const activeMaintenanceCount = data?.maintenance.filter(m => m.status === "Scheduled" || m.status === "In Progress").length || 0;

  function handleNav(id: string) {
    if (role === "admin") {
      setAdminPage(id as AdminPage);
      if (id === "computers") {
        setComputerLocationFilter?.("All");
      }
    } else {
      setStaffPage(id as StaffPage);
    }
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 h-full select-none shadow-xs">
      {/* Category Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
          {role === "admin" ? "Management Suite" : "Staff Portal"}
        </span>
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
          {nav.length} Views
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = currentPage === item.id;
          const isProblems = item.id === "problems" || item.id === "my-problems";
          const isMaintenance = item.id === "maintenance" || item.id === "maintenance-status";

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group cursor-pointer ${
                  isActive
                    ? "bg-[#28166F]/10 text-[#28166F] font-bold border-l-2 border-[#28166F]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? "text-[#28166F]" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    <AppIcon name={item.icon} size={16} />
                  </span>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Dynamic Notification Badges */}
                  {isProblems && openProblemsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                      {openProblemsCount}
                    </span>
                  )}
                  {isMaintenance && activeMaintenanceCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#28166F] border border-indigo-200">
                      {activeMaintenanceCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Info Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#28166F] border border-indigo-200 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
              <AppIcon name="user" size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate leading-tight tracking-tight font-sans">
                {role === "admin" ? "System Admin" : "Lab Staff"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5 font-mono">
                {role === "admin" ? "admin@school.edu" : "staff@school.edu"}
              </div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] flex-shrink-0" title="Online" />
        </div>
      </div>
    </aside>
  );
}

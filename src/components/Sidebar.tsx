import type { AdminPage, StaffPage, UserRole } from "../App";
import type { AppData } from "../data";
import { CAMPUS_LOCATIONS } from "../data";
import { useState } from "react";
import Modal from "./Modal";
import { AppIcon } from "./Icons";

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
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
  onLogout,
  adminPage,
  setAdminPage,
  staffPage,
  setStaffPage,
  data,
  computerLocationFilter = "All",
  setComputerLocationFilter,
}: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [computersExpanded, setComputersExpanded] = useState(true);
  const currentPage = role === "admin" ? adminPage : staffPage;
  const nav = role === "admin" ? adminNav : staffNav;

  const openProblemsCount = data?.problems.filter(p => p.status === "Open" || p.status === "In Progress").length || 0;
  const activeMaintenanceCount = data?.maintenance.filter(m => m.status === "Scheduled" || m.status === "In Progress").length || 0;

  function handleNav(id: string) {
    if (role === "admin") {
      if (id === "computers") {
        if (adminPage === "computers") {
          setComputersExpanded(prev => !prev);
        } else {
          setComputersExpanded(true);
          setAdminPage("computers");
          setComputerLocationFilter?.("All");
        }
      } else {
        setAdminPage(id as AdminPage);
      }
    } else {
      setStaffPage(id as StaffPage);
    }
  }

  function handleLocationSubnav(locId: string) {
    setAdminPage("computers");
    setComputerLocationFilter?.(locId);
  }

  // Count computers per campus location
  const getLocationCount = (locId: string) => {
    if (!data) return 0;
    if (locId === "All") return data.computers.length;
    const l = locId.toLowerCase();
    return data.computers.filter(c => {
      const cloc = c.location.toLowerCase();
      if (l === "comlab") return cloc.includes("comlab");
      if (l === "shs lab") return cloc.includes("shs");
      if (l === "registrar") return cloc.includes("registrar") || cloc.includes("reg");
      if (l === "laboratory") return (cloc.includes("laboratory") || cloc.includes("lab")) && !cloc.includes("comlab") && !cloc.includes("shs");
      return cloc.includes(l);
    }).length;
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0b1329] border-r border-[#1e293b] h-full select-none">
      {/* Navigation Header */}
      <div className="px-5 py-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#080e20]/50">
        <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
          {role === "admin" ? "Management Suite" : "Staff Portal"}
        </span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
          {nav.length} Views
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = currentPage === item.id;
          const isComputers = item.id === "computers";
          const isProblems = item.id === "problems" || item.id === "my-problems";
          const isMaintenance = item.id === "maintenance" || item.id === "maintenance-status";

          return (
            <div key={item.id} className="space-y-0.5">
              <button
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors group ${
                  isActive
                    ? "bg-[#131f38] text-white font-bold border-l-2 border-[#0ea5e9]"
                    : "text-slate-300 hover:text-white hover:bg-[#0f172a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? "text-[#38bdf8]" : "text-[#64748b] group-hover:text-[#94a3b8]"
                    }`}
                  >
                    <AppIcon name={item.icon} size={16} />
                  </span>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Dynamic Notification Badges */}
                  {isProblems && openProblemsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      {openProblemsCount}
                    </span>
                  )}
                  {isMaintenance && activeMaintenanceCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                      {activeMaintenanceCount}
                    </span>
                  )}
                  {isComputers && role === "admin" && (
                    <span className={`text-xs font-bold transition-transform duration-200 text-slate-500 ${computersExpanded ? "rotate-90 text-sky-400" : ""}`}>
                      ›
                    </span>
                  )}
                </div>
              </button>

              {/* Expandable Campus Labs Submenu under Computers */}
              {isComputers && role === "admin" && computersExpanded && (
                <div className="pl-5 pr-1 py-1 space-y-0.5 border-l border-sky-500/20 ml-4 animate-fadeIn">
                  {/* All Workstations */}
                  <button
                    onClick={() => handleLocationSubnav("All")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                      isActive && computerLocationFilter === "All"
                        ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AppIcon name="computers" size={13} className={isActive && computerLocationFilter === "All" ? "text-sky-300" : "text-slate-500"} />
                      <span className="font-bold">All Workstations</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {data?.computers.length || 0}
                    </span>
                  </button>

                  {/* Campus Lab Locations */}
                  {CAMPUS_LOCATIONS.map((loc) => {
                    const count = getLocationCount(loc.id);
                    const isLocActive = isActive && computerLocationFilter === loc.id;

                    return (
                      <button
                        key={loc.id}
                        onClick={() => handleLocationSubnav(loc.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                          isLocActive
                            ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/60 font-bold"
                        }`}
                        title={loc.fullName}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <AppIcon name={loc.icon} size={13} className={isLocActive ? "text-sky-300" : "text-slate-500"} />
                          <span className="truncate font-bold">{loc.label}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                          isLocActive ? "bg-sky-500/30 text-sky-200" : "bg-slate-800 text-slate-400"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Card & Sign Out */}
      <div className="p-3 border-t border-[#1e293b]/80 bg-[#080e20]">
        <div className="p-2.5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] flex items-center justify-center text-xs font-black text-white flex-shrink-0">
              {role === "admin" ? "AD" : "ST"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate leading-tight tracking-tight">
                {role === "admin" ? "System Admin" : "Lab Staff"}
              </div>
              <div className="text-[10px] text-slate-400 font-bold truncate leading-tight mt-0.5 font-mono">
                {role === "admin" ? "admin@school.edu" : "staff@school.edu"}
              </div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] flex-shrink-0" title="Online" />
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-bold">Sign Out</span>
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <Modal title="Confirm Sign Out" subtitle="End your active session" onClose={() => setShowLogoutConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-[#94a3b8]">
              Are you sure you want to sign out of the <span className="font-semibold text-white">St. Rita's CIMS</span> system? Any unsaved changes may be lost.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20"
              >
                Yes, Sign Out
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-xs font-medium rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}

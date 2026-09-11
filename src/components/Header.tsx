import { useState, useRef, useEffect } from "react";
import { AppIcon } from "./Icons";
import type { AdminPage, StaffPage, UserRole } from "../App";
import { CAMPUS_LOCATIONS } from "../data";

interface HeaderProps {
  role: UserRole;
  adminPage: AdminPage;
  staffPage: StaffPage;
  computerLocationFilter?: string;
  setComputerLocationFilter?: (loc: string) => void;
  onLogout: () => void;
}

const ADMIN_PAGE_TITLES: Record<AdminPage, { title: string; category: string }> = {
  dashboard: { title: "Dashboard", category: "Management Suite" },
  computers: { title: "Computers", category: "Hardware Inventory" },
  problems: { title: "Problems", category: "Helpdesk & Issues" },
  maintenance: { title: "Maintenance", category: "Operations" },
  history: { title: "History", category: "Audit & Lifecycle" },
  audit: { title: "Audit Log", category: "Compliance & Security" },
};

const STAFF_PAGE_TITLES: Record<StaffPage, { title: string; category: string }> = {
  dashboard: { title: "Dashboard", category: "Staff Portal" },
  report: { title: "Report Problem", category: "Incident Reporting" },
  "my-problems": { title: "View Problems", category: "Issue Tracking" },
  "computer-status": { title: "Computer Status", category: "Workstations" },
  "maintenance-status": { title: "Maintenance Status", category: "Servicing" },
};

export default function Header({
  role,
  adminPage,
  staffPage,
  computerLocationFilter = "All",
  setComputerLocationFilter,
  onLogout,
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const meta = role === "admin" ? ADMIN_PAGE_TITLES[adminPage] : STAFF_PAGE_TITLES[staffPage];
  const activeLocation = CAMPUS_LOCATIONS.find(l => l.id === computerLocationFilter);

  // Format today's date cleanly
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Handle click outside to close profile popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setShowLogoutConfirm(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 select-none z-30 relative transition-colors shadow-xs">
      {/* Brand & Left Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-[#28166F]/20 overflow-hidden">
            <img src="/logo.png" alt="St. Rita's Seal" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-serif font-bold text-slate-900 tracking-tight">CIMS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28166F]/10 text-[#28166F] border border-[#28166F]/20 uppercase tracking-wider font-sans">
                {role}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans">
              St. Rita's College of Balingasag
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-200" />

        {/* Current Section Breadcrumb Context */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs font-sans">
          <span className="text-slate-500 font-medium">{meta.category}</span>
          <span className="text-slate-300">/</span>
          {role === "admin" && adminPage === "computers" ? (
            <>
              {computerLocationFilter && computerLocationFilter !== "All" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setComputerLocationFilter?.("All")}
                    className="text-slate-600 hover:text-[#28166F] font-bold transition-colors cursor-pointer"
                    title="Reset to All Workstations"
                  >
                    Computers
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-[#28166F] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#28166F]/10 border border-[#28166F]/20">
                    <AppIcon name={activeLocation?.icon || "computers"} size={12} />
                    <span>{computerLocationFilter}</span>
                  </span>
                </>
              ) : (
                <span className="text-slate-900 font-bold">{meta.title}</span>
              )}
            </>
          ) : (
            <span className="text-slate-900 font-bold">{meta.title}</span>
          )}
        </nav>
      </div>

      {/* Right Controls & Info */}
      <div className="flex items-center gap-3.5">
        {/* Current Date */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <AppIcon name="calendar" size={13} className="text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-200" />

        {/* ========================================================
            INTERACTIVE PROFILE ICON WITH LOGOUT
        ======================================================== */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(prev => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            title="User Profile & Settings"
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isProfileOpen
                ? "bg-[#28166F] text-white border-[#28166F] ring-2 ring-[#28166F]/20"
                : "bg-white hover:bg-slate-50 text-slate-700 hover:text-[#28166F] border-slate-200"
            }`}
          >
            <AppIcon name="user" size={17} />
          </button>

          {/* Profile Popover / Modal Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 text-left z-50 animate-dialogPop">
              {/* User Identity Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-[#28166F] border-2 border-indigo-200 flex items-center justify-center text-white shadow-xs flex-shrink-0 font-sans">
                  <AppIcon name="user" size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate font-sans">
                      {role === "admin" ? "Administrator" : "Academic Staff"}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Online
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">
                    {role === "admin" ? "admin@school.edu" : "staff@school.edu"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                    St. Rita's College of Balingasag
                  </div>
                </div>
              </div>

              {/* Single Logout Section */}
              <div className="pt-3">
                {!showLogoutConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group"
                  >
                    <AppIcon name="logout" size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Sign Out of CIMS</span>
                  </button>
                ) : (
                  <div className="space-y-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 animate-dialogPop">
                    <div className="text-xs font-bold text-rose-800 text-center">
                      Confirm Sign Out?
                    </div>
                    <p className="text-[11px] text-slate-600 text-center leading-tight">
                      This will safely end your active session on this device.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowLogoutConfirm(false);
                          onLogout();
                        }}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Yes, Sign Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

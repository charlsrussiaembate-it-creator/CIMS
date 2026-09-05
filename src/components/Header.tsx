import { AppIcon } from "./Icons";
import type { AdminPage, StaffPage, UserRole } from "../App";
import type { AppData } from "../data";
import { CAMPUS_LOCATIONS } from "../data";

interface HeaderProps {
  role: UserRole;
  adminPage: AdminPage;
  staffPage: StaffPage;
  data?: AppData;
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
  data,
  computerLocationFilter = "All",
  setComputerLocationFilter,
  onLogout,
}: HeaderProps) {
  const meta = role === "admin" ? ADMIN_PAGE_TITLES[adminPage] : STAFF_PAGE_TITLES[staffPage];
  const activeLocation = CAMPUS_LOCATIONS.find(l => l.id === computerLocationFilter);

  const totalPCs = data?.computers.length || 0;
  const activePCs = data?.computers.filter(c => c.status === "Active").length || 0;
  const openIssues = data?.problems.filter(p => p.status === "Open" || p.status === "In Progress").length || 0;

  // Format today's date cleanly
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="h-16 flex-shrink-0 bg-[#080e20] border-b border-[#1e293b] flex items-center justify-between px-6 select-none z-20">
      {/* Brand & Left Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-[#080e20] font-bold text-sm tracking-wider flex-shrink-0 shadow-sm">
            CI
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">CIMS</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                {role}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              St. Rita's College of Balingasag
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-800" />

        {/* Current Section Breadcrumb Context */}
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">{meta.category}</span>
          <span className="text-slate-600">/</span>
          {role === "admin" && adminPage === "computers" ? (
            <>
              {computerLocationFilter && computerLocationFilter !== "All" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setComputerLocationFilter?.("All")}
                    className="text-slate-400 hover:text-sky-400 font-bold transition-colors cursor-pointer"
                    title="Reset to All Workstations"
                  >
                    Computers
                  </button>
                  <span className="text-slate-600">/</span>
                  <span className="text-sky-400 font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                    <AppIcon name={activeLocation?.icon || "computers"} size={12} />
                    <span>{computerLocationFilter}</span>
                  </span>
                </>
              ) : (
                <span className="text-slate-200 font-bold">Computers</span>
              )}
            </>
          ) : (
            <span className="text-slate-200 font-bold">{meta.title}</span>
          )}
        </nav>
      </div>

      {/* Right Controls & Info */}
      <div className="flex items-center gap-4">
        {/* System Health Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              openIssues === 0
                ? "bg-emerald-400"
                : "bg-amber-400"
            }`}
          />
          <span className="text-slate-300 font-medium">
            {openIssues === 0
              ? `All ${activePCs}/${totalPCs} PCs Healthy`
              : `${openIssues} Active Issue${openIssues > 1 ? "s" : ""} Flagged`}
          </span>
        </div>

        {/* Current Date */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <AppIcon name="calendar" size={13} className="text-slate-500" />
          <span>{todayFormatted}</span>
        </div>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-800" />

        {/* User Badge & Logout Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
              {role === "admin" ? "AD" : "ST"}
            </div>
            <div className="hidden xl:block leading-tight text-left">
              <div className="text-xs font-semibold text-white">
                {role === "admin" ? "System Administrator" : "Academic Staff"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {role === "admin" ? "admin@demo.com" : "staff@demo.com"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out of Session"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <AppIcon name="logout" size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

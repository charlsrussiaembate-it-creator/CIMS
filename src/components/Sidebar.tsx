import type { AdminPage, StaffPage, UserRole } from "../App";

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
  adminPage: AdminPage;
  setAdminPage: (p: AdminPage) => void;
  staffPage: StaffPage;
  setStaffPage: (p: StaffPage) => void;
}

const adminNav: { id: AdminPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "computers", label: "Computers", icon: "🖥" },
  { id: "problems", label: "Problems", icon: "⚠" },
  { id: "maintenance", label: "Maintenance", icon: "🔧" },
  { id: "history", label: "History", icon: "📋" },
  { id: "audit", label: "Audit Log", icon: "🗂" },
];

const staffNav: { id: StaffPage; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "⊞" },
  { id: "report", label: "Report Problem", icon: "✚" },
  { id: "my-problems", label: "View Problems", icon: "⚠" },
  { id: "computer-status", label: "Computer Status", icon: "🖥" },
  { id: "maintenance-status", label: "Maintenance Status", icon: "🔧" },
];

const adminPerms = ["Manage computers", "Log maintenance", "Manage problems", "View audit log"];
const staffPerms = [
  { label: "View computer status", ok: true },
  { label: "Report problems", ok: true },
  { label: "View maintenance status", ok: true },
  { label: "Edit/delete records", ok: false },
];

export default function Sidebar({ role, onLogout, adminPage, setAdminPage, staffPage, setStaffPage }: SidebarProps) {
  const currentPage = role === "admin" ? adminPage : staffPage;
  const nav = role === "admin" ? adminNav : staffNav;

  function handleNav(id: string) {
    if (role === "admin") setAdminPage(id as AdminPage);
    else setStaffPage(id as StaffPage);
  }

  function handleLogout() {
    if (window.confirm("Are you sure you want to log out?")) onLogout();
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-[#0b1425] border-r border-[#1e293b] h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#0ea5e9] flex items-center justify-center text-[#0f172a] font-bold text-sm select-none">CI</div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">CIMS</div>
            <div className="text-[10px] text-[#64748b] leading-tight">St. Rita's College</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-[10px] uppercase tracking-widest text-[#475569] px-3 mb-2">
          {role === "admin" ? "Administration" : "Staff Menu"}
        </div>
        {nav.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
              currentPage === item.id
                ? "bg-[#1e3a5f] text-[#38bdf8] border-l-2 border-[#0ea5e9]"
                : "text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1e293b]"
            } ${item.id === "report" ? "mt-1" : ""}`}
          >
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "report" && (
              <span className="ml-auto text-[9px] bg-[#0ea5e9] text-[#0f172a] px-1.5 py-0.5 rounded font-bold">NEW</span>
            )}
          </button>
        ))}
      </nav>

      {/* Permissions */}
      <div className="px-4 py-4 border-t border-[#1e293b]">
        <div className="text-[10px] uppercase tracking-widest text-[#334155] mb-2 px-1">Permissions</div>
        {role === "admin" ? (
          <ul className="space-y-1">
            {adminPerms.map(p => (
              <li key={p} className="flex items-center gap-2 text-[10px] text-[#475569]">
                <span className="text-emerald-500">✓</span>{p}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1">
            {staffPerms.map(p => (
              <li key={p.label} className="flex items-center gap-2 text-[10px]">
                <span className={p.ok ? "text-emerald-500" : "text-[#334155]"}>{p.ok ? "✓" : "✗"}</span>
                <span className={p.ok ? "text-[#475569]" : "text-[#334155]"}>{p.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-[10px] text-[#334155] mt-3">CIMS v1.0 · St. Rita's College</div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-md border border-[#334155] px-3 py-2 text-left text-xs font-medium text-[#94a3b8] transition-colors hover:border-[#64748b] hover:bg-[#1e293b] hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

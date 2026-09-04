import type { AdminPage, StaffPage, UserRole } from "../App";
import { useState } from "react";
import Modal from "./Modal";

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


export default function Sidebar({
  role,
  onLogout,
  adminPage,
  setAdminPage,
  staffPage,
  setStaffPage,
}: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const currentPage = role === "admin" ? adminPage : staffPage;
  const nav = role === "admin" ? adminNav : staffNav;

  function handleNav(id: string) {
    if (role === "admin") setAdminPage(id as AdminPage);
    else setStaffPage(id as StaffPage);
  }

  function handleLogout() {
    setShowLogoutConfirm(true);
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-[#0b1425] border-r border-[#1e293b] h-full sticky top-0">
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
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1e293b]">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md border border-[#334155] px-3 py-2 text-left text-xs font-medium text-[#94a3b8] transition-colors hover:border-[#64748b] hover:bg-[#1e293b] hover:text-white"
        >
          Sign Out
        </button>
      </div>
      {showLogoutConfirm && (
        <Modal title="Sign Out Confirmation" onClose={() => setShowLogoutConfirm(false)}>
          <p className="text-sm text-[#94a3b8]">Are you sure you want to sign out of your account?</p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}

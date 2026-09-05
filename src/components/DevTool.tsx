import { AppIcon } from "./Icons";
import type { AdminPage, StaffPage, UserRole } from "../App";
import type { AppData } from "../data";

interface DevToolProps {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  adminPage?: AdminPage;
  setAdminPage?: (p: AdminPage) => void;
  staffPage?: StaffPage;
  setStaffPage?: (p: StaffPage) => void;
  data?: AppData;
  setData?: React.Dispatch<React.SetStateAction<AppData>>;
  onReloadData?: () => Promise<void>;
  addLog?: (role: UserRole, actor: string, action: string, details: string) => void;
}

export default function DevTool({
  isAuthenticated,
  setIsAuthenticated,
  role,
  setRole,
}: DevToolProps) {
  function handleSwitch(newRole: UserRole) {
    setRole(newRole);
    if (!isAuthenticated) {
      setIsAuthenticated(true);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center bg-[#0b1425]/90 border border-[#334155] rounded-full p-1 shadow-2xl backdrop-blur-md select-none gap-1">
      <div className="flex items-center px-2.5 py-1 text-[11px] font-semibold text-[#64748b] gap-1.5">
        <AppIcon name="bolt" size={12} className="text-amber-400" />
        <span className="hidden sm:inline">Role:</span>
      </div>

      <button
        type="button"
        onClick={() => handleSwitch("admin")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
          role === "admin" && isAuthenticated
            ? "bg-[#0ea5e9] text-[#0f172a] shadow-md shadow-[#0ea5e9]/30"
            : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
        }`}
        title="Switch to Administrator role"
      >
        <AppIcon name="shield" size={13} />
        <span>Admin</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch("staff")}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
          role === "staff" && isAuthenticated
            ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
            : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
        }`}
        title="Switch to Staff role"
      >
        <AppIcon name="staff" size={13} />
        <span>Staff</span>
      </button>
    </div>
  );
}

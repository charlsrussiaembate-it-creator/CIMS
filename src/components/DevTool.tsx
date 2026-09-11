import { useState } from "react";
import { AppIcon } from "./Icons";
import type { UserRole } from "../App";

interface DevToolProps {
  isAuthenticated: boolean;
  setIsAuthenticated?: (v: boolean) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
}

export default function DevTool({
  isAuthenticated,
  setIsAuthenticated,
  role,
  setRole,
}: DevToolProps) {
  // Default to collapsed so it never blocks page content
  const [isExpanded, setIsExpanded] = useState(false);

  function handleSwitch(newRole: UserRole) {
    setRole(newRole);
    if (!isAuthenticated && setIsAuthenticated) {
      setIsAuthenticated(true);
    }
  }

  // When collapsed: sleek, minimal floating chip that stays out of the way
  if (!isExpanded) {
    return (
      <aside aria-label="Developer Tools" className="fixed bottom-4 right-4 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/90 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-mono font-bold"
          title="Open Developer Role Switcher"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <AppIcon name="bolt" size={12} className="text-amber-500" />
          <span className="text-[11px] tracking-tight">Dev:</span>
          <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#28166F] font-bold">
            {role}
          </span>
          <span className="text-slate-400 group-hover:text-slate-600 text-[9px] ml-0.5">▲</span>
        </button>
      </aside>
    );
  }

  // When expanded: compact floating control box with role switch and minimize button
  return (
    <aside aria-label="Developer Tools" className="fixed bottom-4 right-4 z-40 select-none animate-dialogPop">
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-64 text-left font-sans">
        {/* Header with Title and Minimize */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AppIcon name="bolt" size={12} className="text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block leading-none">
                Developer Tool
              </span>
              <span className="text-[9px] font-medium text-slate-400 font-mono">Role Emulator</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            title="Minimize Developer Tool"
          >
            ✕
          </button>
        </div>

        {/* Role Switch Buttons */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-500">Simulate User Account:</div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitch("admin")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "admin"
                  ? "bg-[#28166F] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <AppIcon name="shield" size={12} />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitch("staff")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === "staff"
                  ? "bg-[#28166F] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <AppIcon name="staff" size={12} />
              <span>Staff</span>
            </button>
          </div>
        </div>

        {/* Status indicator footer */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Active Role:</span>
          <span className="font-bold text-[#28166F] uppercase">{role}</span>
        </div>
      </div>
    </aside>
  );
}

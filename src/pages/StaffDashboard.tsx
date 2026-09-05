import type { AppData } from "../data";
import type { StaffPage } from "../App";
import StatusBadge, { getComputerStatusVariant, getProblemStatusVariant } from "../components/StatusBadge";
import { AppIcon } from "../components/Icons";
import type { ReactNode } from "react";

interface Props {
  data: AppData;
  setPage: (p: StaffPage) => void;
}

interface ActionTileProps {
  icon: ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  badge?: string;
  badgeColor?: string;
}

function ActionTile({ icon, title, description, action, onClick, badge, badgeColor }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 rounded-xl border bg-[#1e293b] border-[#334155] transition-all group hover:scale-[1.01] hover:border-[#475569] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#0f172a] border border-[#334155] flex items-center justify-center">
          {icon}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor || "bg-white/20 text-white"}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="text-base font-bold mb-1 text-white">{title}</div>
      <div className="text-sm font-semibold mb-4 text-slate-300">{description}</div>
      <div className="text-xs font-bold flex items-center gap-1 transition-gap group-hover:gap-2 text-[#0ea5e9]">
        {action} <span>→</span>
      </div>
    </button>
  );
}

export default function StaffDashboard({ data, setPage }: Props) {
  const { computers, problems, maintenance } = data;

  const openProblems = problems.filter(p => p.status === "Open");
  const needsAttention = computers.filter(c => c.status === "Needs Maintenance" || c.status === "Under Repair");
  const scheduledMaintenance = maintenance.filter(m => m.status === "Scheduled");
  const inProgressMaintenance = maintenance.filter(m => m.status === "In Progress");

  const recentProblems = [...problems]
    .sort((a, b) => b.dateReported.localeCompare(a.dateReported))
    .slice(0, 3);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded">Staff Portal</span>
        </div>
        <h1 className="text-2xl font-black text-white">Welcome to CIMS</h1>
        <p className="text-sm font-bold text-slate-400 mt-1">St. Rita's College of Balingasag — Computer Inventory &amp; Maintenance System</p>
      </div>

      {/* Quick stats banner */}
      {(openProblems.length > 0 || needsAttention.length > 0) && (
        <div className="flex gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center">
          <AppIcon name="warning" size={20} className="text-amber-400 flex-shrink-0" />
          <div className="text-sm font-bold text-amber-300">
            {openProblems.length > 0 && <span><strong>{openProblems.length}</strong> open problem{openProblems.length !== 1 ? "s" : ""} awaiting admin action. </span>}
            {needsAttention.length > 0 && <span><strong>{needsAttention.length}</strong> computer{needsAttention.length !== 1 ? "s" : ""} needing attention.</span>}
          </div>
        </div>
      )}

      {/* Action tiles */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <ActionTile
          icon={<AppIcon name="pencil" size={24} className="text-sky-400" />}
          title="Report a Problem"
          description="Found an issue with a computer? Submit a report and the admin team will address it."
          action="Start report"
          onClick={() => setPage("report")}
          badge="ACTION"
          badgeColor="bg-[#0c3a55] text-[#38bdf8]"
        />
        <ActionTile
          icon={<AppIcon name="problems" size={24} className="text-rose-400" />}
          title="View Reported Problems"
          description={`${openProblems.length} open, ${problems.filter(p => p.status === "In Progress").length} in progress. Track the status of all reported issues.`}
          action="View problems"
          onClick={() => setPage("my-problems")}
          badge={openProblems.length > 0 ? String(openProblems.length) : undefined}
          badgeColor="bg-red-500/20 text-red-400"
        />
        <ActionTile
          icon={<AppIcon name="computers" size={24} className="text-emerald-400" />}
          title="Check Computer Status"
          description={`${computers.filter(c => c.status === "Active").length} active, ${needsAttention.length} needing attention. View all lab computers and their current status.`}
          action="View computers"
          onClick={() => setPage("computer-status")}
          badge={needsAttention.length > 0 ? `${needsAttention.length} flagged` : undefined}
          badgeColor="bg-amber-500/20 text-amber-400"
        />
        <ActionTile
          icon={<AppIcon name="maintenance" size={24} className="text-indigo-400" />}
          title="View Maintenance Status"
          description={`${scheduledMaintenance.length} scheduled, ${inProgressMaintenance.length} in progress. See what maintenance is planned for the labs.`}
          action="View maintenance"
          onClick={() => setPage("maintenance-status")}
        />
      </div>

      {/* Recent activity */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">Recent Problems</h2>
          <button onClick={() => setPage("my-problems")} className="text-xs font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
            View all →
          </button>
        </div>
        <div className="space-y-3">
          {recentProblems.map(p => {
            return (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#0ea5e9]">{p.computerId}</span>
                    <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">{p.description}</p>
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400 flex-shrink-0">{p.dateReported}</div>
              </div>
            );
          })}
          {recentProblems.length === 0 && (
            <div className="text-xs font-bold text-slate-400 text-center py-4">No problems reported yet</div>
          )}
        </div>
      </div>

      {/* Computers needing attention */}
      {needsAttention.length > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">Computers Needing Attention</h2>
            <button onClick={() => setPage("computer-status")} className="text-xs font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {needsAttention.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                <span className="font-mono text-xs font-bold text-[#0ea5e9]">{c.id}</span>
                <span className="text-xs font-bold text-slate-200 flex-1">{c.location}</span>
                <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

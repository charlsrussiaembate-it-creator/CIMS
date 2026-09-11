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
      className="text-left p-5 rounded-xl border bg-white border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group active:scale-[0.99] cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            {icon}
          </div>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans border ${badgeColor || "bg-slate-100 text-slate-700 border-slate-200"}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm font-serif font-bold mb-1 text-slate-900 tracking-tight">{title}</div>
        <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">{description}</p>
      </div>
      <div className="text-xs font-semibold flex items-center gap-1.5 text-[#28166F] group-hover:gap-2 transition-all mt-auto pt-2 border-t border-slate-100">
        <span>{action}</span>
        <span>→</span>
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
    <div className="p-5 sm:p-6 max-w-6xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Staff Workspace</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Laboratory Computer Inventory &amp; Maintenance Portal</p>
        </div>
      </div>

      {/* Quick stats banner */}
      {(openProblems.length > 0 || needsAttention.length > 0) && (
        <div className="flex gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl items-center text-amber-900 shadow-2xs">
          <AppIcon name="warning" size={18} className="text-amber-600 flex-shrink-0" />
          <div className="text-xs font-medium">
            {openProblems.length > 0 && <span><strong className="font-bold text-amber-950">{openProblems.length}</strong> open problem{openProblems.length !== 1 ? "s" : ""} awaiting admin action. </span>}
            {needsAttention.length > 0 && <span><strong className="font-bold text-amber-950">{needsAttention.length}</strong> computer{needsAttention.length !== 1 ? "s" : ""} flagged for attention.</span>}
          </div>
        </div>
      )}

      {/* Action tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <ActionTile
          icon={<AppIcon name="pencil" size={20} className="text-[#28166F]" />}
          title="Report a Problem"
          description="Encountered hardware or OS malfunction? Submit a priority ticket."
          action="Start ticket"
          onClick={() => setPage("report")}
          badge="ACTION"
          badgeColor="bg-indigo-50 text-[#28166F] border-indigo-200"
        />
        <ActionTile
          icon={<AppIcon name="problems" size={20} className="text-rose-600" />}
          title="Reported Problems"
          description={`${openProblems.length} open, ${problems.filter(p => p.status === "In Progress").length} in progress tickets.`}
          action="View tickets"
          onClick={() => setPage("my-problems")}
          badge={openProblems.length > 0 ? `${openProblems.length} open` : undefined}
          badgeColor="bg-rose-50 text-rose-700 border-rose-200"
        />
        <ActionTile
          icon={<AppIcon name="computers" size={20} className="text-emerald-600" />}
          title="Workstation Status"
          description={`${computers.filter(c => c.status === "Active").length} active, ${needsAttention.length} needing attention.`}
          action="View computers"
          onClick={() => setPage("computer-status")}
          badge={needsAttention.length > 0 ? `${needsAttention.length} flagged` : undefined}
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />
        <ActionTile
          icon={<AppIcon name="maintenance" size={20} className="text-[#28166F]" />}
          title="Maintenance Schedule"
          description={`${scheduledMaintenance.length} scheduled, ${inProgressMaintenance.length} in progress.`}
          action="View schedule"
          onClick={() => setPage("maintenance-status")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent activity */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">Recent Problems</h2>
            <button
              onClick={() => setPage("my-problems")}
              className="text-xs font-semibold text-[#28166F] hover:text-[#1c0f4e] transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2.5">
            {recentProblems.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#28166F]">{p.computerId}</span>
                    <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.description}</p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-medium flex-shrink-0">{p.dateReported}</div>
              </div>
            ))}
            {recentProblems.length === 0 && (
              <div className="text-xs font-medium text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
                No problems reported yet
              </div>
            )}
          </div>
        </div>

        {/* Computers needing attention */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">Flagged Workstations</h2>
            <button
              onClick={() => setPage("computer-status")}
              className="text-xs font-semibold text-[#28166F] hover:text-[#1c0f4e] transition-colors"
            >
              View all →
            </button>
          </div>
          {needsAttention.length === 0 ? (
            <div className="text-xs font-medium text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
              All workstations are currently in healthy operating condition.
            </div>
          ) : (
            <div className="space-y-2.5">
              {needsAttention.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all">
                  <span className="font-mono text-xs font-bold text-[#28166F]">{c.id}</span>
                  <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{c.location}</span>
                  <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

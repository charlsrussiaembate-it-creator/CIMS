import type { AppData } from "../data";
import type { AdminPage } from "../App";
import StatusBadge, { getProblemStatusVariant, getMaintenanceStatusVariant } from "../components/StatusBadge";
import { AppIcon } from "../components/Icons";

interface Props {
  data: AppData;
  setPage: (p: AdminPage) => void;
}

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  badge?: string;
  badgeColor?: string;
  icon: string;
  accentGradient: string;
  borderColor: string;
  onClick: () => void;
}

function StatCard({
  label,
  value,
  sub,
  badge,
  badgeColor = "bg-[#0ea5e9]/15 text-[#38bdf8] border-[#0ea5e9]/30",
  icon,
  borderColor,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl bg-[#0f172a] border ${borderColor} p-5 cursor-pointer transition-all duration-200 hover:border-[#475569] hover:bg-[#131d33] group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-center text-slate-200">
          <AppIcon name={icon} size={18} />
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      <div className="text-xs font-bold text-slate-200 mt-1">{label}</div>
      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{sub}</div>

      <div className="mt-3 pt-3 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-sky-400 font-bold">
        <span>View Details</span>
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </div>
    </div>
  );
}

export default function AdminDashboard({ data, setPage }: Props) {
  const { computers, problems, maintenance, auditLogs } = data;

  const active = computers.filter(c => c.status === "Active").length;
  const needsMaintenance = computers.filter(c => c.status === "Needs Maintenance").length;
  const underRepair = computers.filter(c => c.status === "Under Repair").length;
  const decommissioned = computers.filter(c => c.status === "Decommissioned").length;
  const needsAttention = needsMaintenance + underRepair;

  const openProblems = problems.filter(p => p.status === "Open").length;
  const inProgressProblems = problems.filter(p => p.status === "In Progress").length;

  const scheduledMaintenance = maintenance.filter(m => m.status === "Scheduled").length;
  const inProgressMaintenance = maintenance.filter(m => m.status === "In Progress").length;
  const completedMaintenance = maintenance.filter(m => m.status === "Completed").length;

  const recentProblems = [...problems]
    .sort((a, b) => b.dateReported.localeCompare(a.dateReported))
    .slice(0, 4);

  const upcomingMaintenance = maintenance
    .filter(m => m.status === "Scheduled" || m.status === "In Progress")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 4);

  const recentLogs = [...auditLogs]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);

  // Group computers by location for quick lab stats
  const labCounts: Record<string, number> = {};
  computers.forEach(c => {
    const labName = c.location.split("—")[0]?.trim() || "Other";
    labCounts[labName] = (labCounts[labName] || 0) + 1;
  });

  const totalComps = computers.length || 1;
  const activePercent = Math.round((active / totalComps) * 100);
  const attentionPercent = Math.round((needsAttention / totalComps) * 100);
  const decommissionedPercent = Math.round((decommissioned / totalComps) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Overview</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              Live Fleet Active
            </span>
          </div>
          <p className="text-xs font-bold text-slate-300">
            St. Rita's College of Balingasag · Computer Laboratories &amp; Asset Command Center
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setPage("computers")}
            className="btn-primary"
          >
            <AppIcon name="plus" size={13} />
            <span>Add Workstation</span>
          </button>
          <button
            type="button"
            onClick={() => setPage("maintenance")}
            className="btn-secondary font-bold"
          >
            <AppIcon name="maintenance" size={13} />
            <span>Schedule Job</span>
          </button>
          <button
            type="button"
            onClick={() => setPage("problems")}
            className="btn-secondary font-bold text-rose-300 hover:text-rose-200"
          >
            <AppIcon name="warning" size={13} />
            <span>Log Issue</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Inventory"
          value={computers.length}
          sub={`${active} operational in labs`}
          badge={`${activePercent}% Active`}
          badgeColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          icon="computers"
          accentGradient="bg-sky-500"
          borderColor="border-[#0ea5e9]/30"
          onClick={() => setPage("computers")}
        />
        <StatCard
          label="Requires Attention"
          value={needsAttention}
          sub={`${underRepair} under repair · ${needsMaintenance} scheduled`}
          badge={needsAttention > 0 ? "Action Needed" : "Optimal"}
          badgeColor={needsAttention > 0 ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}
          icon="maintenance"
          accentGradient="bg-amber-500"
          borderColor="border-amber-500/30"
          onClick={() => setPage("computers")}
        />
        <StatCard
          label="Reported Problems"
          value={openProblems}
          sub={`${inProgressProblems} currently being fixed`}
          badge={openProblems > 0 ? `${openProblems} Unresolved` : "All Solved"}
          badgeColor={openProblems > 0 ? "bg-rose-500/15 text-rose-300 border-rose-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}
          icon="warning"
          accentGradient="bg-rose-500"
          borderColor="border-rose-500/30"
          onClick={() => setPage("problems")}
        />
        <StatCard
          label="Maintenance Operations"
          value={scheduledMaintenance + inProgressMaintenance}
          sub={`${completedMaintenance} successfully finished`}
          badge={`${completedMaintenance} Completed`}
          badgeColor="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          icon="tool"
          accentGradient="bg-emerald-500"
          borderColor="border-emerald-500/30"
          onClick={() => setPage("maintenance")}
        />
      </div>

      {/* Fleet Health Meter */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              Fleet Health &amp; Readiness Meter
            </h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">
              Live status ratio of all registered laboratory computer workstations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Active ({active})
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Maintenance ({needsMaintenance})
            </span>
            <span className="flex items-center gap-1.5 font-bold text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Under Repair ({underRepair})
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Decommissioned ({decommissioned})
            </span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3.5 bg-[#131d33] rounded-full overflow-hidden flex shadow-inner border border-[#1e293b]">
          <div
            style={{ width: `${activePercent}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Active: ${active}`}
          />
          <div
            style={{ width: `${(needsMaintenance / totalComps) * 100}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
            title={`Needs Maintenance: ${needsMaintenance}`}
          />
          <div
            style={{ width: `${(underRepair / totalComps) * 100}%` }}
            className="h-full bg-orange-500 transition-all duration-500"
            title={`Under Repair: ${underRepair}`}
          />
          <div
            style={{ width: `${(decommissioned / totalComps) * 100}%` }}
            className="h-full bg-slate-600 transition-all duration-500"
            title={`Decommissioned: ${decommissioned}`}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#1e293b] text-center">
          <div>
            <div className="text-base font-black text-white">{activePercent}%</div>
            <div className="text-[10px] font-bold text-slate-300 uppercase">Operational</div>
          </div>
          <div>
            <div className="text-base font-black text-amber-400">{attentionPercent}%</div>
            <div className="text-[10px] font-bold text-amber-300/80 uppercase">In Service Queue</div>
          </div>
          <div>
            <div className="text-base font-black text-sky-400">{computers.length}</div>
            <div className="text-[10px] font-bold text-sky-300/80 uppercase">Total Units</div>
          </div>
          <div>
            <div className="text-base font-black text-slate-300">{decommissionedPercent}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Retired</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Active Action Queues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Recent Problems */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AppIcon name="warning" size={16} className="text-rose-400" />
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide">Recent Problem Reports</h2>
                  <p className="text-[11px] font-bold text-slate-400">Issues reported by students and lab faculty</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("problems")}
                className="text-xs font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors"
              >
                Open Ticket Manager →
              </button>
            </div>

            {recentProblems.length === 0 ? (
              <div className="p-8 text-center bg-[#131d33] border border-[#1e293b] rounded-xl text-xs font-bold text-[#64748b]">
                No active problems currently logged. All workstations running smoothly.
              </div>
            ) : (
              <div className="space-y-3">
                {recentProblems.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#131d33] border border-[#1e293b] hover:border-[#334155] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#38bdf8]">{p.computerId}</span>
                        <span className="font-mono text-[10px] font-bold text-[#64748b]">{p.id}</span>
                        <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                      </div>
                      <p className="text-xs font-bold text-white leading-relaxed line-clamp-1">{p.description}</p>
                      <div className="text-[10px] font-semibold text-slate-400">
                        Reported by <span className="font-bold text-slate-200">{p.reportedBy}</span> on <span className="font-mono font-bold">{p.dateReported}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage("problems")}
                      className="px-3 py-1.5 bg-[#0f172a] border border-[#334155] text-xs font-bold text-slate-300 hover:text-white hover:border-[#0ea5e9] rounded-lg transition-colors flex-shrink-0 self-end sm:self-center"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Queue: Upcoming Maintenance */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AppIcon name="maintenance" size={16} className="text-sky-400" />
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide">Upcoming Maintenance Schedule</h2>
                  <p className="text-[11px] font-bold text-slate-400">Scheduled preventive cleaning and hardware upgrades</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("maintenance")}
                className="text-xs font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors"
              >
                View Full Calendar →
              </button>
            </div>

            {upcomingMaintenance.length === 0 ? (
              <div className="p-8 text-center bg-[#131d33] border border-[#1e293b] rounded-xl text-xs font-bold text-[#64748b]">
                No pending maintenance jobs on the schedule.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingMaintenance.map(m => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-[#131d33] border border-[#1e293b] hover:border-[#334155] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0ea5e9]">{m.computerId}</span>
                      <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                    </div>
                    <div className="text-xs font-bold text-white">{m.maintenanceType}</div>
                    <p className="text-[11px] font-semibold text-slate-300 line-clamp-1">{m.activity}</p>
                    <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="user" size={10} className="text-slate-400" />
                        <span className="font-bold text-slate-300">{m.technician}</span>
                      </span>
                      <span className="font-mono font-bold text-sky-400">{m.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide): Live Activity Stream & Quick Stats */}
        <div className="space-y-6">
          {/* Live Activity Stream */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-white tracking-wide">Live Activity Stream</h2>
                <p className="text-[11px] font-bold text-slate-400">Real-time audit log feed</p>
              </div>
              <button
                type="button"
                onClick={() => setPage("audit")}
                className="text-xs font-bold text-[#0ea5e9] hover:text-[#38bdf8] transition-colors"
              >
                Full Log →
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.map(log => {
                const isAdmin = log.role === "admin";
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#131d33] border border-[#1e293b] space-y-1 hover:border-[#334155] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isAdmin
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                          }`}
                        >
                          {log.role}
                        </span>
                        <span className="text-xs font-bold text-white">{log.action}</span>
                      </div>
                      <span className="font-mono font-bold text-[9px] text-[#64748b]">
                        {log.timestamp.split(" ")[1] || log.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-300 line-clamp-1">{log.details}</p>
                    <div className="text-[10px] font-semibold text-slate-400">by <span className="font-bold text-slate-300">{log.actor}</span></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lab Allocation Quick Breakdown */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6">
            <h2 className="text-xs font-black text-slate-200 uppercase tracking-wider mb-3">
              Workstation Distribution
            </h2>
            <div className="space-y-2.5">
              {Object.entries(labCounts).map(([lab, count]) => (
                <div key={lab} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">{lab}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                      <div
                        className="h-full bg-[#0ea5e9] rounded-full"
                        style={{ width: `${(count / totalComps) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-white font-black w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  onClick: () => void;
}

function StatCard({
  label,
  value,
  sub,
  badge,
  badgeColor = "bg-slate-100 text-slate-700 border-slate-200",
  icon,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-full group shadow-xs"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#28166F]/10 text-[#28166F] border border-[#28166F]/15 flex items-center justify-center">
            <AppIcon name={icon} size={17} />
          </div>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-sans ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">{value}</div>
        <div className="text-xs font-bold text-slate-800 mt-1 font-sans">{label}</div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5 font-sans truncate">{sub}</div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#28166F] font-bold font-sans">
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

  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* Top Banner */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Admin Overview</h1>
      </div>

      {/* KPI Cards Grid - Perfectly Aligned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Inventory"
          value={computers.length}
          sub={`${active} operational in labs`}
          badge={`${activePercent}% Active`}
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          icon="computers"
          onClick={() => setPage("computers")}
        />
        <StatCard
          label="Requires Attention"
          value={needsAttention}
          sub={`${underRepair} repair · ${needsMaintenance} scheduled`}
          badge={needsAttention > 0 ? "Action Needed" : "Optimal"}
          badgeColor={needsAttention > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
          icon="maintenance"
          onClick={() => setPage("computers")}
        />
        <StatCard
          label="Reported Problems"
          value={openProblems}
          sub={`${inProgressProblems} currently being fixed`}
          badge={openProblems > 0 ? `${openProblems} Open` : "All Solved"}
          badgeColor={openProblems > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
          icon="warning"
          onClick={() => setPage("problems")}
        />
        <StatCard
          label="Maintenance Operations"
          value={scheduledMaintenance + inProgressMaintenance}
          sub={`${completedMaintenance} finished successfully`}
          badge={`${completedMaintenance} Done`}
          badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          icon="tool"
          onClick={() => setPage("maintenance")}
        />
      </div>

      {/* Fleet Health Meter - Compact and High-Density */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <AppIcon name="pulse" size={14} className="text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
              Fleet Health &amp; Readiness
            </h2>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activePercent}% Operational
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-sans flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active: {active}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Maintenance: {needsMaintenance}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-orange-700">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Under Repair: {underRepair}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Retired: {decommissioned}
            </span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
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
            className="h-full bg-slate-400 transition-all duration-500"
            title={`Decommissioned: ${decommissioned}`}
          />
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols wide): Active Action Queues */}
        <div className="lg:col-span-2 space-y-5">
          {/* Action Queue: Recent Problems */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <AppIcon name="warning" size={15} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">Recent Problem Reports</h2>
                  <p className="text-[11px] font-medium text-slate-500">Issues reported across laboratory workstations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("problems")}
                className="text-xs font-semibold text-[#28166F] hover:text-[#1c0f4e] transition-colors"
              >
                Open Ticket Manager →
              </button>
            </div>

            {recentProblems.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                No active problems currently logged. All workstations running smoothly.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentProblems.map(p => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#28166F]">{p.computerId}</span>
                        <span className="font-mono text-[10px] text-slate-500 font-medium">{p.id}</span>
                        <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">{p.description}</p>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Reported by <span className="font-bold text-slate-700">{p.reportedBy}</span> on <span className="font-mono">{p.dateReported}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage("problems")}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#28166F] hover:border-[#28166F]/40 shadow-2xs rounded-md transition-colors flex-shrink-0 self-end sm:self-center"
                    >
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Queue: Upcoming Maintenance */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <AppIcon name="maintenance" size={15} className="text-[#28166F]" />
                </div>
                <div>
                  <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">Upcoming Maintenance Schedule</h2>
                  <p className="text-[11px] font-medium text-slate-500">Scheduled preventive cleaning and system servicing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPage("maintenance")}
                className="text-xs font-semibold text-[#28166F] hover:text-[#1c0f4e] transition-colors"
              >
                View Full Calendar →
              </button>
            </div>

            {upcomingMaintenance.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                No pending maintenance jobs on the schedule.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingMaintenance.map(m => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#28166F]">{m.computerId}</span>
                      <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                    </div>
                    <div className="text-xs font-bold text-slate-900">{m.maintenanceType}</div>
                    <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{m.activity}</p>
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="user" size={10} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{m.technician}</span>
                      </span>
                      <span className="font-mono font-bold text-[#28166F]">{m.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide): Live Activity Stream & Quick Stats */}
        <div className="space-y-5">
          {/* Live Activity Stream */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="font-serif text-sm font-bold text-slate-900 tracking-tight">Live Activity Stream</h2>
                <p className="text-[11px] font-medium text-slate-500">Real-time audit log feed</p>
              </div>
              <button
                type="button"
                onClick={() => setPage("audit")}
                className="text-xs font-semibold text-[#28166F] hover:text-[#1c0f4e] transition-colors"
              >
                Full Log →
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                No audit log events recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLogs.map(log => {
                  const isAdmin = log.role === "admin";
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 space-y-1 hover:border-slate-300 hover:bg-white transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              isAdmin
                                ? "bg-[#28166F]/10 text-[#28166F] border border-[#28166F]/20"
                                : "bg-indigo-50 text-[#28166F] border border-indigo-200"
                            }`}
                          >
                            {log.role}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{log.action}</span>
                        </div>
                        <span className="font-mono font-medium text-[10px] text-slate-500">
                          {log.timestamp.split(" ")[1] || log.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 line-clamp-1">{log.details}</p>
                      <div className="text-[10px] text-slate-500">by <span className="font-bold text-slate-800">{log.actor}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lab Allocation Quick Breakdown */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
            <h2 className="font-serif text-xs font-bold text-slate-900 tracking-wider uppercase mb-3">
              Workstation Distribution
            </h2>
            {Object.entries(labCounts).length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                No workstations registered yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(labCounts).map(([lab, count]) => (
                  <div key={lab} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{lab}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#28166F] rounded-full"
                          style={{ width: `${(count / totalComps) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-900 font-bold w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

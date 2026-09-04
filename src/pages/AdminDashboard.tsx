import type { AppData } from "../data";
import type { AdminPage } from "../App";
import StatusBadge, { getProblemStatusVariant, getMaintenanceStatusVariant } from "../components/StatusBadge";

interface Props {
  data: AppData;
  setPage: (p: AdminPage) => void;
}

function StatCard({ label, value, sub, color, onClick }: { label: string; value: number; sub: string; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#1e293b] border border-[#334155] rounded-xl p-5 relative overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-[#64748b] hover:bg-[#24334a]" : ""
      }`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${color} rounded-l-xl`} />
      <div className="pl-2">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm font-medium text-[#94a3b8] mt-0.5">{label}</div>
        <div className="text-xs text-[#475569] mt-1">{sub}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ data, setPage }: Props) {
  const { computers, problems, maintenance } = data;

  const active = computers.filter(c => c.status === "Active").length;
  const needsAttention = computers.filter(c => c.status === "Needs Maintenance" || c.status === "Under Repair").length;
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

  const recentLogs = data.auditLogs.slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-[#64748b] mt-1">St. Rita's College of Balingasag — Computer Laboratory Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Computers" value={computers.length} sub={`${active} active`} color="bg-[#0ea5e9]" onClick={() => setPage("computers")} />
        <StatCard label="Need Attention" value={needsAttention} sub="maintenance or repair" color="bg-amber-500" onClick={() => setPage("computers")} />
        <StatCard label="Open Problems" value={openProblems} sub={`${inProgressProblems} in progress`} color="bg-red-500" onClick={() => setPage("problems")} />
        <StatCard label="Maintenance Jobs" value={scheduledMaintenance + inProgressMaintenance} sub={`${completedMaintenance} completed total`} color="bg-emerald-500" onClick={() => setPage("maintenance")} />
      </div>

      {/* Status bars */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mb-6">
        <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Computer Status Breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active", count: active, color: "bg-emerald-500" },
            { label: "Needs Maintenance", count: computers.filter(c => c.status === "Needs Maintenance").length, color: "bg-amber-500" },
            { label: "Under Repair", count: computers.filter(c => c.status === "Under Repair").length, color: "bg-orange-500" },
            { label: "Decommissioned", count: computers.filter(c => c.status === "Decommissioned").length, color: "bg-slate-500" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#64748b]">{item.label}</span>
                <span className="text-xs font-mono text-white">{item.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#334155] overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${computers.length > 0 ? (item.count / computers.length) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Problems */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Recent Problems</h2>
            <button onClick={() => setPage("problems")} className="text-xs text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">View all →</button>
          </div>
          <div className="space-y-3">
            {recentProblems.map(p => {
              return (
                <div key={p.id} className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#0ea5e9]">{p.computerId}</span>
                    <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                  </div>
                  <p className="text-xs text-[#94a3b8] truncate">{p.description}</p>
                  <div className="text-[10px] text-[#475569] mt-1">{p.dateReported} · {p.reportedBy}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Upcoming Maintenance</h2>
            <button onClick={() => setPage("maintenance")} className="text-xs text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">View all →</button>
          </div>
          {upcomingMaintenance.length === 0 ? (
            <div className="text-xs text-[#475569] py-4 text-center">No upcoming maintenance</div>
          ) : (
            <div className="space-y-3">
              {upcomingMaintenance.map(m => {
                return (
                  <div key={m.id} className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#0ea5e9]">{m.computerId}</span>
                      <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                    </div>
                    <p className="text-xs text-[#94a3b8] truncate">{m.maintenanceType}</p>
                    <div className="text-[10px] text-[#475569] mt-1">{m.scheduledDate} · {m.technician}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Recent Activity</h2>
            <button onClick={() => setPage("audit")} className="text-xs text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">View all →</button>
          </div>
          <div className="space-y-3">
            {recentLogs.map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-[#0f172a] border border-[#1e293b]">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.role === "admin" ? "bg-[#0ea5e9]/15 text-[#0ea5e9]" : "bg-violet-500/15 text-violet-400"}`}>
                    {log.role}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{log.action}</span>
                </div>
                <p className="text-[10px] text-[#475569] truncate">{log.details}</p>
                <div className="text-[10px] font-mono text-[#334155] mt-1">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

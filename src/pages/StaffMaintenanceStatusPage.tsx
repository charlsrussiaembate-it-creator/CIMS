import type { AppData } from "../data";
import StatusBadge, { getMaintenanceStatusVariant } from "../components/StatusBadge";

interface Props {
  data: AppData;
}

export default function StaffMaintenanceStatusPage({ data }: Props) {
  const upcoming = data.maintenance
    .filter(m => m.status === "Scheduled" || m.status === "In Progress")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const completed = data.maintenance
    .filter(m => m.status === "Completed")
    .sort((a, b) => (b.completedDate || "").localeCompare(a.completedDate || ""))
    .slice(0, 5);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded">Read Only</span>
        <h1 className="text-2xl font-bold text-white mt-1">Maintenance Status</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Current and upcoming maintenance activities.</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">Upcoming &amp; In Progress</h2>
        {upcoming.length === 0 ? (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center text-xs text-[#475569]">
            No upcoming maintenance scheduled
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(m => {
              const computer = data.computers.find(c => c.id === m.computerId);
              return (
                <div key={m.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#0f172a] border border-[#334155] flex items-center justify-center text-lg flex-shrink-0">
                    {m.status === "In Progress" ? "🔧" : "📅"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-[#0ea5e9]">{m.computerId}</span>
                      <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                      <span className="text-xs text-[#475569]">{m.maintenanceType}</span>
                    </div>
                    <p className="text-sm text-white mb-1">{m.activity}</p>
                    {computer && <p className="text-xs text-[#64748b]">{computer.location}</p>}
                    {m.notes && <p className="text-xs text-[#475569] mt-1 italic">{m.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-[#475569]">Scheduled</div>
                    <div className="text-xs font-mono text-[#64748b]">{m.scheduledDate}</div>
                    <div className="text-[10px] text-[#475569] mt-1">Technician</div>
                    <div className="text-xs text-[#64748b]">{m.technician}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">Recently Completed</h2>
        {completed.length === 0 ? (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center text-xs text-[#475569]">No completed maintenance yet</div>
        ) : (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Computer</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Activity</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Completed</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {completed.map(m => (
                  <tr key={m.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#0ea5e9]">{m.computerId}</td>
                    <td className="px-5 py-3.5 text-xs text-[#94a3b8] max-w-48 truncate">{m.activity}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-[#475569]">{m.completedDate || "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

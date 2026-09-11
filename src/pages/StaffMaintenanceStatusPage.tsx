import type { AppData } from "../data";
import StatusBadge, { getMaintenanceStatusVariant } from "../components/StatusBadge";
import { AppIcon } from "../components/Icons";

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
    <div className="p-5 sm:p-6 max-w-5xl mx-auto space-y-4 font-sans text-slate-900">
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold font-mono text-[#28166F] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Staff View</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Maintenance Schedule</h1>
        <p className="text-xs text-slate-500 mt-0.5">Current and scheduled maintenance servicing across laboratory workstations.</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">Upcoming &amp; In Progress</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">
            No upcoming maintenance scheduled at this time.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map(m => {
              const computer = data.computers.find(c => c.id === m.computerId);
              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-[#28166F]">
                    <AppIcon
                      name={m.status === "In Progress" ? "bolt" : "calendar"}
                      size={16}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#28166F] bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200">{m.computerId}</span>
                      <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                      <span className="text-xs text-slate-500 font-medium">{m.maintenanceType}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mb-0.5">{m.activity}</p>
                    {computer && <p className="text-xs text-slate-500 font-medium">{computer.location}</p>}
                    {m.notes && <p className="text-xs text-slate-500 mt-1 italic">"{m.notes}"</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Scheduled</div>
                    <div className="text-xs font-mono font-bold text-[#28166F]">{m.scheduledDate}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Technician</div>
                    <div className="text-xs text-slate-800 font-medium">{m.technician}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">Recently Completed</h2>
        {completed.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500 shadow-xs">No completed maintenance yet</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="text-left px-5 py-2.5">Workstation</th>
                  <th className="text-left px-5 py-2.5">Activity</th>
                  <th className="text-left px-5 py-2.5">Completed Date</th>
                  <th className="text-left px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completed.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#28166F]">{m.computerId}</td>
                    <td className="px-5 py-3 text-xs text-slate-800 font-semibold max-w-48 truncate">{m.activity}</td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-600 font-medium">{m.completedDate || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} /></td>
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

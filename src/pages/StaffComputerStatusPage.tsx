import type { AppData } from "../data";
import StatusBadge, { getComputerStatusVariant } from "../components/StatusBadge";

interface Props {
  data: AppData;
}

export default function StaffComputerStatusPage({ data }: Props) {
  const grouped: Record<string, typeof data.computers> = {};
  for (const c of data.computers) {
    const lab = c.location.split("—")[0].trim();
    if (!grouped[lab]) grouped[lab] = [];
    grouped[lab].push(c);
  }

  return (
    <div className="p-5 sm:p-6 max-w-5xl mx-auto space-y-4 font-sans text-slate-900">
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold font-mono text-[#28166F] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Staff View</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Workstation Status</h1>
        <p className="text-xs text-slate-500 mt-0.5">Current operational status of all computers across campus laboratories.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Units", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", count: data.computers.filter(c => c.status === "Active").length },
          { label: "Needs Maintenance", color: "text-amber-800", bg: "bg-amber-50 border-amber-200", count: data.computers.filter(c => c.status === "Needs Maintenance").length },
          { label: "Under Repair", color: "text-orange-800", bg: "bg-orange-50 border-orange-200", count: data.computers.filter(c => c.status === "Under Repair").length },
          { label: "Decommissioned", color: "text-slate-700", bg: "bg-slate-100 border-slate-200", count: data.computers.filter(c => c.status === "Decommissioned").length },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.count}</div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([lab, computers]) => (
        <div key={lab} className="space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">{lab} ({computers.length} Units)</div>
          <div className="bg-white border border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="text-left px-5 py-2.5">Computer ID</th>
                  <th className="text-left px-5 py-2.5">Location / Seat</th>
                  <th className="text-left px-5 py-2.5">OS</th>
                  <th className="text-left px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#28166F]">{c.id}</td>
                    <td className="px-5 py-3 text-xs text-slate-700 font-medium">{c.location.split("—")[1]?.trim() || c.location}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{c.os}</td>
                    <td className="px-5 py-3">
                      <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

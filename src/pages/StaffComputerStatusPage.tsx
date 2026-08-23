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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <span className="text-xs font-mono text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded">Read Only</span>
        <h1 className="text-2xl font-bold text-white mt-1">Computer Status</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Current status of all lab computers.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active", color: "text-emerald-400", count: data.computers.filter(c => c.status === "Active").length },
          { label: "Needs Maintenance", color: "text-amber-400", count: data.computers.filter(c => c.status === "Needs Maintenance").length },
          { label: "Under Repair", color: "text-orange-400", count: data.computers.filter(c => c.status === "Under Repair").length },
          { label: "Decommissioned", color: "text-slate-400", count: data.computers.filter(c => c.status === "Decommissioned").length },
        ].map(s => (
          <div key={s.label} className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[10px] text-[#475569] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([lab, computers]) => (
        <div key={lab} className="mb-5">
          <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2 px-1">{lab}</div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Computer ID</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Location</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">OS</th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {computers.map(c => (
                  <tr key={c.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-[#0ea5e9]">{c.id}</td>
                    <td className="px-5 py-3.5 text-xs text-[#94a3b8]">{c.location.split("—")[1]?.trim() || c.location}</td>
                    <td className="px-5 py-3.5 text-xs text-[#64748b]">{c.os}</td>
                    <td className="px-5 py-3.5">
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

import { useState } from "react";
import type { AppData } from "../data";
import StatusBadge, { getComputerStatusVariant, getProblemStatusVariant, getMaintenanceStatusVariant } from "../components/StatusBadge";

interface Props {
  data: AppData;
}

export default function HistoryPage({ data }: Props) {
  const [selectedId, setSelectedId] = useState("");

  const activeId = (selectedId && data.computers.some(c => c.id === selectedId))
    ? selectedId
    : (data.computers[0]?.id || "");

  const computer = data.computers.find(c => c.id === activeId);
  const computerProblems = data.problems.filter(p => p.computerId === activeId).sort((a, b) => b.dateReported.localeCompare(a.dateReported));
  const computerMaintenance = data.maintenance.filter(m => m.computerId === activeId).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  type TimelineEntry =
    | { type: "maintenance"; date: string; m: typeof computerMaintenance[0] }
    | { type: "problem"; date: string; p: typeof computerProblems[0] };

  const timeline: TimelineEntry[] = [
    ...computerMaintenance.map(m => ({ type: "maintenance" as const, date: m.scheduledDate, m })),
    ...computerProblems.map(p => ({ type: "problem" as const, date: p.dateReported, p })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Full activity timeline per computer</p>
      </div>

      {/* Computer selector */}
      <div className="mb-6">
        <div className="text-xs font-medium text-[#64748b] mb-2">Select Computer</div>
        <div className="flex flex-wrap gap-2">
          {data.computers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeId === c.id
                  ? "bg-[#0ea5e9] text-[#0f172a]"
                  : "bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#475569]"
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {computer && (
        <>
          {/* Computer info */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-lg font-bold text-[#0ea5e9]">{computer.id}</span>
                  <StatusBadge label={computer.status} variant={getComputerStatusVariant(computer.status)} />
                </div>
                <div className="text-sm text-[#94a3b8]">{computer.location}</div>
                <div className="text-xs text-[#475569] mt-1">{computer.cpu} · {computer.ram} · {computer.storage}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#475569]">OS</div>
                <div className="text-sm text-[#94a3b8]">{computer.os}</div>
                <div className="text-xs text-[#475569] mt-2">Acquired</div>
                <div className="text-xs font-mono text-[#64748b]">{computer.dateAcquired}</div>
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t border-[#334155]">
              <div>
                <div className="text-xl font-bold text-white">{computerMaintenance.length}</div>
                <div className="text-xs text-[#475569]">Maintenance records</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{computerProblems.length}</div>
                <div className="text-xs text-[#475569]">Problems reported</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{computerProblems.filter(p => p.status === "Resolved" || p.status === "Closed").length}</div>
                <div className="text-xs text-[#475569]">Problems resolved</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length === 0 ? (
            <div className="text-center py-16 text-[#475569] text-sm">No history for this computer</div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#1e293b]" />
              <div className="space-y-4">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex gap-5">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm z-10 border-2 ${
                      entry.type === "maintenance"
                        ? "bg-[#1e3a5f] border-[#0ea5e9]"
                        : "bg-[#3b1a1a] border-[#ef4444]"
                    }`}>
                      {entry.type === "maintenance" ? "🔧" : "⚠"}
                    </div>
                    <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                              {entry.type === "maintenance" ? "Maintenance" : "Problem"}
                            </span>
                            <span className="font-mono text-[10px] text-[#334155]">
                              {entry.type === "maintenance" ? entry.m.id : entry.p.id}
                            </span>
                            {entry.type === "maintenance" && (
                              <>
                                <span className="text-xs text-[#475569]">{entry.m.maintenanceType}</span>
                                <StatusBadge label={entry.m.status} variant={getMaintenanceStatusVariant(entry.m.status)} />
                              </>
                            )}
                            {entry.type === "problem" && (
                              <StatusBadge label={entry.p.status} variant={getProblemStatusVariant(entry.p.status)} />
                            )}
                          </div>
                          {entry.type === "maintenance" ? (
                            <>
                              <p className="text-sm text-white mb-1">{entry.m.activity}</p>
                              <div className="text-xs text-[#64748b]">Technician: {entry.m.technician}</div>
                              {entry.m.notes && <div className="text-xs text-[#475569] mt-1 italic">{entry.m.notes}</div>}
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-white mb-1">{entry.p.description}</p>
                              <div className="text-xs text-[#64748b]">Reported by: {entry.p.reportedBy}</div>
                            </>
                          )}
                        </div>
                        <div className="text-xs font-mono text-[#475569] flex-shrink-0">{entry.date}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

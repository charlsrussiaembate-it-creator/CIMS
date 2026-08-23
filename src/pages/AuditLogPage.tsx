import { useState } from "react";
import type { AppData } from "../data";

interface Props {
  data: AppData;
}

export default function AuditLogPage({ data }: Props) {
  const [filterRole, setFilterRole] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = data.auditLogs.filter(log => {
    const matchRole = filterRole === "All" || log.role === filterRole;
    const matchSearch = !search || log.action.toLowerCase().includes(search.toLowerCase()) || log.details.toLowerCase().includes(search.toLowerCase()) || log.actor.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-[#64748b] mt-0.5">{data.auditLogs.length} activity records — complete history of all actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search actions, details, or actor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#0ea5e9] transition-colors"
        />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#0ea5e9] transition-colors">
          <option>All</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#1e293b]" />
        <div className="space-y-3">
          {filtered.map(log => (
            <div key={log.id} className="flex gap-5 relative">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold z-10 border-2 ${
                log.role === "admin"
                  ? "bg-[#1e3a5f] border-[#0ea5e9] text-[#0ea5e9]"
                  : "bg-[#2a1a3f] border-[#a78bfa] text-[#a78bfa]"
              }`}>
                {log.role === "admin" ? "AD" : "ST"}
              </div>
              <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-xl p-4 hover:border-[#475569] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        log.role === "admin" ? "bg-[#0ea5e9]/15 text-[#0ea5e9]" : "bg-violet-500/15 text-violet-400"
                      }`}>
                        {log.role}
                      </span>
                      <span className="text-sm font-semibold text-white">{log.action}</span>
                      <span className="text-xs text-[#64748b]">by {log.actor}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">{log.details}</p>
                  </div>
                  <div className="text-[10px] font-mono text-[#475569] flex-shrink-0 text-right">
                    <div>{log.id}</div>
                    <div className="mt-0.5">{log.timestamp}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#475569] text-sm">No activity records matching filters</div>
          )}
        </div>
      </div>
    </div>
  );
}

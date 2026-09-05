import { useState } from "react";
import type { AppData } from "../data";
import { todayDate } from "../data";
import { AppIcon } from "../components/Icons";

interface Props {
  data: AppData;
}

export default function AuditLogPage({ data }: Props) {
  const [filterRole, setFilterRole] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  const sorted = [...data.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Categorize actions for filtering and badge coloring
  const getActionCategory = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("computer") || act.includes("workstation")) return "Workstation";
    if (act.includes("maintenance")) return "Maintenance";
    if (act.includes("problem") || act.includes("issue") || act.includes("resolve")) return "Incident";
    if (act.includes("login") || act.includes("access") || act.includes("session")) return "Access";
    return "General";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Workstation":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "Maintenance":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
      case "Incident":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Access":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const filtered = sorted.filter(log => {
    const matchRole = filterRole === "All" || log.role === filterRole;
    const category = getActionCategory(log.action);
    const matchCategory = filterCategory === "All" || category === filterCategory;
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    return matchRole && matchCategory && matchSearch;
  });

  // Metrics
  const adminLogsCount = data.auditLogs.filter(l => l.role === "admin").length;
  const staffLogsCount = data.auditLogs.filter(l => l.role === "staff").length;
  const todayLogsCount = data.auditLogs.filter(l => l.timestamp.startsWith(todayDate())).length;

  // CSV Export
  const exportToCSV = () => {
    if (filtered.length === 0) return;

    const headers = ["ID", "Timestamp", "Role", "Actor", "Category", "Action", "Details"];
    const rows = filtered.map(log => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.role}"`,
      `"${log.actor.replace(/"/g, '""')}"`,
      `"${getActionCategory(log.action)}"`,
      `"${log.action.replace(/"/g, '""')}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cims_audit_log_${todayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Trail</h1>
          </div>
          <p className="text-sm text-slate-400">
            Immutable log of all user interventions, status changes, and administrative actions.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className="btn-secondary text-sky-400 border-sky-500/30 hover:border-sky-500/60"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Records</div>
          <div className="text-2xl font-bold text-white mt-1">{data.auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Historical entries</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Actions</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{adminLogsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Elevated executions</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Reports</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{staffLogsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Issues & submissions</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Activity</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{todayLogsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Events since midnight</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRole("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterRole === "All" ? "bg-sky-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterRole === "admin" ? "bg-sky-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Admin Only
            </button>
            <button
              onClick={() => setFilterRole("staff")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterRole === "staff" ? "bg-sky-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Staff Only
            </button>
          </div>

          {/* Search & Category */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search action, actor, details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="All">All Categories</option>
              <option value="Workstation">Workstation Fleet</option>
              <option value="Maintenance">Maintenance Servicing</option>
              <option value="Incident">Incident Reports</option>
              <option value="Access">Access & Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="space-y-2.5">
        {filtered.map(log => {
          const category = getActionCategory(log.action);
          const categoryStyle = getCategoryColor(category);
          const isAdmin = log.role === "admin";

          return (
            <div
              key={log.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                {/* Role Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    isAdmin
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  }`}
                >
                  {isAdmin ? "AD" : "ST"}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white group-hover:text-sky-200 transition-colors">
                      {log.action}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${categoryStyle}`}>
                      {category}
                    </span>
                    <span className="text-xs text-slate-400">
                      by <strong className="text-slate-200">{log.actor}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {log.details}
                  </p>
                </div>
              </div>

              {/* Timestamp & ID */}
              <div className="sm:text-right flex-shrink-0 text-xs font-mono text-slate-400 flex sm:flex-col justify-between sm:justify-start gap-1">
                <span className="text-slate-300">{log.timestamp}</span>
                <span className="text-[10px] text-slate-500">{log.id}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <AppIcon name="search" size={22} />
            </div>
            <div className="font-semibold text-slate-300">No activity logs matching criteria</div>
            <p className="text-xs text-slate-500 mt-1">Try relaxing the search keyword or role filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

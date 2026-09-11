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
        return "bg-indigo-50 text-[#28166F] border-indigo-200";
      case "Maintenance":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Incident":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Access":
        return "bg-indigo-50 text-[#28166F] border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
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
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">System Audit Trail</h1>
          </div>
          <p className="text-xs text-slate-500">
            Immutable log of all user interventions, status changes, and administrative actions.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filtered.length === 0}
          className="btn-secondary flex items-center gap-1.5 cursor-pointer"
        >
          <AppIcon name="document" size={13} />
          <span>Export CSV ({filtered.length})</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Records</div>
          <div className="text-2xl font-bold font-serif text-slate-900 mt-1">{data.auditLogs.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Historical entries</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admin Actions</div>
          <div className="text-2xl font-bold font-serif text-[#28166F] mt-1">{adminLogsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Elevated executions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff Reports</div>
          <div className="text-2xl font-bold font-serif text-purple-700 mt-1">{staffLogsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Issues &amp; submissions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Activity</div>
          <div className="text-2xl font-bold font-serif text-emerald-700 mt-1">{todayLogsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Events since midnight</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRole("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRole === "All" ? "bg-[#28166F] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRole === "admin" ? "bg-[#28166F] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Admin Only
            </button>
            <button
              onClick={() => setFilterRole("staff")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRole === "staff" ? "bg-[#28166F] text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Staff Only
            </button>
          </div>

          {/* Search & Category */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <AppIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search action, actor, details..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] focus:bg-white transition-colors"
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#28166F] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Workstation">Workstation Fleet</option>
              <option value="Maintenance">Maintenance Servicing</option>
              <option value="Incident">Incident Reports</option>
              <option value="Access">Access &amp; Security</option>
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
              className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition-colors shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                {/* Role Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    isAdmin
                      ? "bg-indigo-50 border-indigo-200 text-[#28166F]"
                      : "bg-purple-50 border-purple-200 text-purple-700"
                  }`}
                >
                  <AppIcon name="user" size={14} />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#28166F] transition-colors">
                      {log.action}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded border ${categoryStyle}`}>
                      {category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      by <strong className="text-slate-800 font-bold">{log.actor}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {log.details}
                  </p>
                </div>
              </div>

              {/* Timestamp & ID */}
              <div className="sm:text-right flex-shrink-0 text-xs font-mono text-slate-500 flex sm:flex-col justify-between sm:justify-start gap-0.5">
                <span className="text-slate-800 font-bold">{log.timestamp}</span>
                <span className="text-[10px] text-slate-500 font-medium">{log.id}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-500">
              <AppIcon name="search" size={18} />
            </div>
            <div className="font-serif font-bold text-slate-900 text-sm">No activity logs matching criteria</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Try relaxing the search keyword or role filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import type { AppData } from "../data";
import { CAMPUS_LOCATIONS } from "../data";
import StatusBadge, { getComputerStatusVariant, getProblemStatusVariant, getMaintenanceStatusVariant } from "../components/StatusBadge";
import { AppIcon } from "../components/Icons";

interface Props {
  data: AppData;
}

const getLabBadge = (loc: string) => {
  const l = loc.toLowerCase();
  if (l.includes("comlab")) return { id: "ComLab", label: "ComLab", icon: "comlab", color: "bg-indigo-50 text-[#28166F] border-indigo-200" };
  if (l.includes("shs")) return { id: "SHS Lab", label: "SHS Lab", icon: "shs", color: "bg-purple-50 text-purple-700 border-purple-200" };
  if (l.includes("registrar") || l.includes("reg")) return { id: "Registrar", label: "Registrar", icon: "registrar", color: "bg-indigo-50 text-[#28166F] border-indigo-200" };
  if (l.includes("laboratory") || l.includes("lab")) return { id: "Laboratory", label: "Laboratory", icon: "laboratory", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { id: "Other", label: loc.split("—")[0]?.trim() || "Other", icon: "location", color: "bg-slate-100 text-slate-700 border-slate-200" };
};

export default function HistoryPage({ data }: Props) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ComLab");
  const [selectedComputerId, setSelectedComputerId] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "problem" | "maintenance">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to count computers per location
  const getLocationCount = (locId: string) => {
    if (locId === "All") return data.computers.length;
    const l = locId.toLowerCase();
    return data.computers.filter(c => {
      const cloc = c.location.toLowerCase();
      if (l === "comlab") return cloc.includes("comlab");
      if (l === "shs lab") return cloc.includes("shs");
      if (l === "registrar") return cloc.includes("registrar") || cloc.includes("reg");
      if (l === "laboratory") return (cloc.includes("laboratory") || cloc.includes("lab")) && !cloc.includes("comlab") && !cloc.includes("shs");
      return cloc.includes(l);
    }).length;
  };

  // Computers belonging to the currently selected department/lab
  const departmentComputers = useMemo(() => {
    const l = selectedDepartment.toLowerCase();
    return data.computers.filter(c => {
      const cloc = c.location.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        c.id.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.cpu.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (l === "all") return true;
      if (l === "comlab") return cloc.includes("comlab");
      if (l === "shs lab") return cloc.includes("shs");
      if (l === "registrar") return cloc.includes("registrar") || cloc.includes("reg");
      if (l === "laboratory") return (cloc.includes("laboratory") || cloc.includes("lab")) && !cloc.includes("comlab") && !cloc.includes("shs");
      return cloc.includes(l);
    });
  }, [data.computers, selectedDepartment, searchQuery]);

  // Determine active inspected computer
  const activeId = useMemo(() => {
    if (selectedComputerId && departmentComputers.some(c => c.id === selectedComputerId)) {
      return selectedComputerId;
    }
    return departmentComputers[0]?.id || "";
  }, [selectedComputerId, departmentComputers]);

  const computer = data.computers.find(c => c.id === activeId);
  const computerProblems = data.problems.filter(p => p.computerId === activeId).sort((a, b) => b.dateReported.localeCompare(a.dateReported));
  const computerMaintenance = data.maintenance.filter(m => m.computerId === activeId).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  type TimelineEntry =
    | { type: "maintenance"; date: string; m: typeof computerMaintenance[0] }
    | { type: "problem"; date: string; p: typeof computerProblems[0] };

  const allEntries: TimelineEntry[] = [
    ...computerMaintenance.map(m => ({ type: "maintenance" as const, date: m.scheduledDate, m })),
    ...computerProblems.map(p => ({ type: "problem" as const, date: p.dateReported, p })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filteredTimeline = allEntries.filter(entry => {
    if (filterType === "all") return true;
    return entry.type === filterType;
  });

  const resolvedProblems = computerProblems.filter(p => p.status === "Resolved" || p.status === "Closed").length;
  const resolutionRate = computerProblems.length > 0
    ? Math.round((resolvedProblems / computerProblems.length) * 100)
    : 100;

  // Department name and details
  const activeDeptInfo = CAMPUS_LOCATIONS.find(loc => loc.id === selectedDepartment) || {
    id: "All",
    label: "All Campus",
    fullName: "All Campus Workstations",
    icon: "globe",
  };

  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Workstation History &amp; Lifecycle</h1>
        </div>
        <p className="text-xs text-slate-500">
          Select a campus laboratory or room below to view its workstations and inspect individual machine service timelines.
        </p>
      </div>

      {/* 1. Step 1: Select Campus Laboratory / Department */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            1. Select Campus Laboratory / Area
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            Click a lab to filter its computers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {CAMPUS_LOCATIONS.map(loc => {
            const count = getLocationCount(loc.id);
            const isSelected = selectedDepartment === loc.id;

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setSelectedDepartment(loc.id);
                  setSelectedComputerId("");
                }}
                className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#28166F] border-[#28166F] text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <AppIcon name={loc.icon} size={20} className={isSelected ? "text-white" : "text-[#28166F]"} />
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {count} Units
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {loc.label}
                  </div>
                  <div className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-200" : "text-slate-500"}`} title={loc.fullName}>
                    {loc.fullName}
                  </div>
                </div>
              </button>
            );
          })}

          {/* All Campus Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedDepartment("All");
              setSelectedComputerId("");
            }}
            className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between cursor-pointer ${
              selectedDepartment === "All"
                ? "bg-[#28166F] border-[#28166F] text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AppIcon name="globe" size={20} className={selectedDepartment === "All" ? "text-white" : "text-[#28166F]"} />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                selectedDepartment === "All" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {data.computers.length} Units
              </span>
            </div>
            <div>
              <div className={`text-xs font-bold ${selectedDepartment === "All" ? "text-white" : "text-slate-900"}`}>
                All Campus
              </div>
              <div className={`text-[10px] truncate mt-0.5 ${selectedDepartment === "All" ? "text-indigo-200" : "text-slate-500"}`}>
                All enrolled units
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Step 2: Workstations in Selected Department */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AppIcon name={activeDeptInfo.icon} size={16} className="text-[#28166F]" />
            <div>
              <h2 className="text-sm font-bold font-serif text-slate-900 tracking-tight">
                {activeDeptInfo.label} Workstations ({departmentComputers.length})
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Click a workstation below to inspect its lifecycle &amp; service log
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <AppIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in this lab..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Workstation Selector Grid for the Room */}
        {departmentComputers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium">
            No computers enrolled in {activeDeptInfo.label} matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {departmentComputers.map(c => {
              const isSelected = activeId === c.id;
              const probCount = data.problems.filter(p => p.computerId === c.id).length;
              const maintCount = data.maintenance.filter(m => m.computerId === c.id).length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedComputerId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#28166F] border-[#28166F] text-white shadow-xs"
                      : "bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className={`font-mono text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                        {c.id}
                      </span>
                      <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                    </div>
                    <div className={`text-[11px] truncate font-medium ${isSelected ? "text-indigo-200" : "text-slate-600"}`}>
                      {c.location}
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                      {c.cpu}
                    </div>
                  </div>

                  <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-mono font-medium ${
                    isSelected ? "border-white/20 text-indigo-100" : "border-slate-200/70 text-slate-500"
                  }`}>
                    <span>{probCount} issues</span>
                    <span>{maintCount} services</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Active Workstation Detailed Lifecycle & Timeline */}
      {computer && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-base font-bold text-slate-900">{computer.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLabBadge(computer.location).color}`}>
                  {computer.location}
                </span>
                <StatusBadge label={computer.status} variant={getComputerStatusVariant(computer.status)} />
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                Hardware: {computer.cpu} · {computer.ram} · {computer.storage} · {computer.os}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Health Resolution</div>
                <div className="text-xs font-bold font-mono text-[#28166F]">{resolutionRate}%</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Events</div>
                <div className="text-xs font-bold font-mono text-slate-900">{allEntries.length}</div>
              </div>
            </div>
          </div>

          {/* Timeline Filter Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  filterType === "all" ? "bg-[#28166F] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Events ({allEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("problem")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  filterType === "problem" ? "bg-[#28166F] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Problems ({computerProblems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("maintenance")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  filterType === "maintenance" ? "bg-[#28166F] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Maintenance ({computerMaintenance.length})
              </button>
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="space-y-2.5">
            {filteredTimeline.map((entry, idx) => {
              if (entry.type === "problem") {
                const p = entry.p;
                return (
                  <div key={`p-${p.id}-${idx}`} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                          <AppIcon name="warning" size={13} />
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">{p.id}</span>
                        <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-medium">{p.dateReported}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed pl-8">{p.description}</p>
                    <div className="text-[10px] text-slate-600 pl-8 font-medium">Reported by: <span className="font-bold text-slate-800">{p.reportedBy}</span></div>
                  </div>
                );
              } else {
                const m = entry.m;
                return (
                  <div key={`m-${m.id}-${idx}`} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-[#28166F] flex items-center justify-center">
                          <AppIcon name="maintenance" size={13} />
                        </span>
                        <span className="font-mono text-xs font-bold text-[#28166F]">{m.id}</span>
                        <span className="text-xs font-bold text-slate-900">{m.maintenanceType}</span>
                        <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-medium">{m.scheduledDate}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed pl-8">{m.activity}</p>
                    {m.notes && (
                      <p className="text-[11px] text-slate-500 italic pl-8">"{m.notes}"</p>
                    )}
                    <div className="text-[10px] text-slate-600 pl-8 font-medium">Tech: <span className="font-bold text-slate-800">{m.technician}</span></div>
                  </div>
                );
              }
            })}

            {filteredTimeline.length === 0 && (
              <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                No events recorded for this machine under current filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

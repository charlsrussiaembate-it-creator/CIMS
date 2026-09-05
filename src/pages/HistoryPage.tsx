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
  if (l.includes("comlab")) return { id: "ComLab", label: "ComLab", icon: "comlab", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
  if (l.includes("shs")) return { id: "SHS Lab", label: "SHS Lab", icon: "shs", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
  if (l.includes("registrar") || l.includes("reg")) return { id: "Registrar", label: "Registrar", icon: "registrar", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  if (l.includes("laboratory") || l.includes("lab")) return { id: "Laboratory", label: "Laboratory", icon: "laboratory", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  return { id: "Other", label: loc.split("—")[0]?.trim() || "Other", icon: "location", color: "bg-slate-800 text-slate-300 border-slate-700" };
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AppIcon name="history" size={18} />
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workstation History &amp; Lifecycle</h1>
        </div>
        <p className="text-sm text-slate-400">
          Select a campus laboratory or room below to view its workstations and inspect individual machine service timelines.
        </p>
      </div>

      {/* 1. Step 1: Select Campus Laboratory / Department */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            1. Select Campus Laboratory / Area
          </label>
          <span className="text-[11px] text-slate-500">
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
                className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
                  isSelected
                    ? "bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/15 ring-1 ring-sky-500/40"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <AppIcon name={loc.icon} size={22} className={isSelected ? "text-sky-300" : "text-slate-400 group-hover:text-slate-200"} />
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-slate-400"
                  }`}>
                    {count} Units
                  </span>
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                    {loc.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5" title={loc.fullName}>
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
            className={`p-3 rounded-xl border text-left transition-all relative group flex flex-col justify-between ${
              selectedDepartment === "All"
                ? "bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/15 ring-1 ring-sky-500/40"
                : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AppIcon name="globe" size={22} className={selectedDepartment === "All" ? "text-sky-300" : "text-slate-400 group-hover:text-slate-200"} />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                selectedDepartment === "All" ? "bg-sky-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}>
                {data.computers.length} Units
              </span>
            </div>
            <div>
              <div className={`text-xs font-bold ${selectedDepartment === "All" ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                All Campus
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                All enrolled workstations
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Step 2: Workstations in Selected Department */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4.5 backdrop-blur-sm shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AppIcon name={activeDeptInfo.icon} size={18} className="text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {activeDeptInfo.label} Workstations ({departmentComputers.length})
              </h2>
              <span className="text-[11px] text-slate-400">
                Click a workstation below to load its full service history &amp; event stream
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-56">
            <AppIcon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search in this lab..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Workstation Selector Grid for the Room */}
        {departmentComputers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
            No computers enrolled in {activeDeptInfo.label} matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {departmentComputers.map(c => {
              const isSelected = activeId === c.id;
              const probCount = data.problems.filter(p => p.computerId === c.id).length;
              const maintCount = data.maintenance.filter(m => m.computerId === c.id).length;
              const badge = getLabBadge(c.location);

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedComputerId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-b from-sky-500/20 to-sky-950/30 border-sky-500 shadow-md shadow-sky-500/20 ring-1 ring-sky-500/50"
                      : "bg-[#0a0f1d] border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${badge.color} flex-shrink-0`}>
                          <AppIcon name={badge.icon} size={11} />
                          <span>{badge.label}</span>
                        </span>
                        <span className={`font-mono text-xs font-bold truncate ${isSelected ? "text-sky-300" : "text-white"}`}>
                          {c.id}
                        </span>
                      </div>
                      <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate mb-2">
                      <AppIcon name="location" size={11} className="text-slate-500 flex-shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{probCount} issues · {maintCount} jobs</span>
                    {isSelected && (
                      <span className="text-sky-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Step 3: Inspected Computer Passport & History */}
      {computer ? (
        <>
          {/* Workstation Passport Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-2xl font-black text-white tracking-wide">
                    {computer.id}
                  </span>
                  <StatusBadge label={computer.status} variant={getComputerStatusVariant(computer.status)} />
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
                    <AppIcon name="location" size={11} className="text-slate-500" />
                    <span>{computer.location}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Enrolled: <strong className="text-slate-200 font-mono">{computer.dateAcquired}</strong></span>
                  <span className="text-slate-600">·</span>
                  <span>Operating System: <strong className="text-slate-200">{computer.os}</strong></span>
                </div>
              </div>

              {/* Hardware Specs Pills */}
              <div className="grid grid-cols-3 gap-2 bg-[#0a0f1d]/80 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="px-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Processor</span>
                  <span className="text-slate-200 font-medium truncate block max-w-[110px]" title={computer.cpu}>
                    {computer.cpu}
                  </span>
                </div>
                <div className="px-2 border-l border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Memory</span>
                  <span className="text-slate-200 font-medium block">
                    {computer.ram}
                  </span>
                </div>
                <div className="px-2 border-l border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Storage</span>
                  <span className="text-slate-200 font-medium block">
                    {computer.storage}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80 relative z-10">
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-sky-400">{computerMaintenance.length}</div>
                <div className="text-xs text-slate-400 mt-0.5">Maintenance Jobs</div>
              </div>
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-amber-400">{computerProblems.length}</div>
                <div className="text-xs text-slate-400 mt-0.5">Issues Reported</div>
              </div>
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">{resolvedProblems}</div>
                <div className="text-xs text-slate-400 mt-0.5">Issues Resolved</div>
              </div>
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                <div className="text-2xl font-bold text-white">{resolutionRate}%</div>
                <div className="text-xs text-slate-400 mt-0.5">Resolution Rate</div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Event Stream for {computer.id}
                </h2>
                <span className="text-xs text-slate-500">({filteredTimeline.length} events logged)</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    filterType === "all" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Events ({allEntries.length})
                </button>
                <button
                  onClick={() => setFilterType("maintenance")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterType === "maintenance" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <AppIcon name="maintenance" size={12} />
                  <span>Maintenance ({computerMaintenance.length})</span>
                </button>
                <button
                  onClick={() => setFilterType("problem")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterType === "problem" ? "bg-sky-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <AppIcon name="warning" size={12} />
                  <span>Problems ({computerProblems.length})</span>
                </button>
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl text-center py-16 text-slate-500">
                <AppIcon name="history" size={32} className="mx-auto mb-2 text-slate-500" />
                <div className="font-semibold text-slate-300">No events found for {computer.id}</div>
                <p className="text-xs text-slate-500 mt-1">This workstation has a clean operational record.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 ml-3">
                {filteredTimeline.map((entry, idx) => {
                  const isMaintenance = entry.type === "maintenance";

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline Node Icon */}
                      <div
                        className={`absolute -left-[35px] top-1.5 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md border-2 transition-transform group-hover:scale-110 ${
                          isMaintenance
                            ? "bg-sky-950/80 border-sky-400 text-sky-400"
                            : "bg-red-950/80 border-red-500 text-red-400"
                        }`}
                      >
                        {isMaintenance ? <AppIcon name="maintenance" size={14} /> : <AppIcon name="warning" size={14} />}
                      </div>

                      {/* Event Card */}
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4.5 hover:border-slate-700 transition-colors shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                isMaintenance
                                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                                  : "bg-red-500/15 text-red-400 border-red-500/30"
                              }`}
                            >
                              {isMaintenance ? "Maintenance Servicing" : "Incident Report"}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              {isMaintenance ? entry.m.id : entry.p.id}
                            </span>
                            {isMaintenance && (
                              <StatusBadge
                                label={entry.m.status}
                                variant={getMaintenanceStatusVariant(entry.m.status)}
                              />
                            )}
                            {!isMaintenance && (
                              <StatusBadge
                                label={entry.p.status}
                                variant={getProblemStatusVariant(entry.p.status)}
                              />
                            )}
                          </div>

                          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <AppIcon name="calendar" size={12} className="text-slate-500" />
                            <span>{entry.date}</span>
                          </div>
                        </div>

                        {/* Event Details */}
                        {isMaintenance ? (
                          <div className="space-y-2 mt-2">
                            <div className="text-xs text-sky-300 font-semibold">
                              {entry.m.maintenanceType}
                            </div>
                            <p className="text-sm text-white font-medium">
                              {entry.m.activity}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                              <div>Technician: <strong className="text-slate-200">{entry.m.technician}</strong></div>
                              {entry.m.completedDate && (
                                <div className="text-emerald-400 inline-flex items-center gap-1">
                                  <AppIcon name="check" size={11} />
                                  <span>Completed: {entry.m.completedDate}</span>
                                </div>
                              )}
                            </div>
                            {entry.m.notes && (
                              <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 italic mt-2">
                                "{entry.m.notes}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            <p className="text-sm text-white font-medium">
                              {entry.p.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                              <div>Reported By: <strong className="text-slate-200">{entry.p.reportedBy}</strong></div>
                              {(entry.p.status === "Resolved" || entry.p.status === "Closed") && (
                                <div className="text-emerald-400 inline-flex items-center gap-1">
                                  <AppIcon name="check" size={11} />
                                  <span>Status: {entry.p.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
          No workstation selected. Click a computer card above to inspect its lifecycle history.
        </div>
      )}
    </div>
  );
}

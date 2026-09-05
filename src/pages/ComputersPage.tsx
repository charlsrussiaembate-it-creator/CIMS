import { useState, useEffect } from "react";
import { todayDate, CAMPUS_LOCATIONS } from "../data";
import type { AppData, Computer, ComputerStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getComputerStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";
import { AppIcon } from "../components/Icons";
import { api } from "../api";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
  activeLocationFilter?: string;
  setActiveLocationFilter?: (loc: string) => void;
}

const STATUSES: ComputerStatus[] = ["Active", "Needs Maintenance", "Under Repair", "Decommissioned"];
const OS_OPTIONS = [
  "Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", "Windows 10 Home",
  "Ubuntu 22.04 LTS", "Ubuntu 20.04 LTS", "Fedora 40", "macOS Sonoma", "macOS Ventura", "Chrome OS",
];
const CPU_OPTIONS = [
  "Intel Core i3-10100", "Intel Core i3-12100", "Intel Core i5-11400", "Intel Core i5-12400",
  "Intel Core i7-12700", "Intel Core i7-13700", "AMD Ryzen 3 5300G", "AMD Ryzen 5 5600",
  "AMD Ryzen 5 5600G", "AMD Ryzen 7 5700G", "Apple M1", "Apple M2", "Apple M3", "Other",
];
const RAM_OPTIONS = ["4 GB DDR3", "8 GB DDR3", "8 GB DDR4", "16 GB DDR4", "32 GB DDR4", "32 GB DDR5", "16 GB Unified", "Other"];
const STORAGE_OPTIONS = ["128 GB HDD", "256 GB HDD", "500 GB HDD", "1 TB HDD", "128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "1 TB NVMe SSD", "Other"];

const emptyForm = (): Omit<Computer, "id"> => ({
  name: "",
  location: "",
  cpu: "Intel Core i5-12400",
  ram: "16 GB DDR4",
  storage: "512 GB SSD",
  gpu: "Intel UHD 730",
  os: "Windows 11 Pro",
  status: "Active",
  dateAcquired: todayDate(),
});

export const getLabBadge = (loc: string) => {
  const l = loc.toLowerCase();
  if (l.includes("comlab")) return { label: "ComLab", icon: "comlab", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
  if (l.includes("shs")) return { label: "SHS Lab", icon: "shs", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
  if (l.includes("registrar") || l.includes("reg")) return { label: "Registrar", icon: "registrar", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  if (l.includes("laboratory") || l.includes("lab")) return { label: "Laboratory", icon: "laboratory", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  return { label: loc.split("—")[0]?.trim() || "Room", icon: "location", color: "bg-slate-800 text-slate-300 border-slate-700" };
};

export default function ComputersPage({
  data,
  setData,
  addLog,
  activeLocationFilter = "All",
  setActiveLocationFilter,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLocation, setFilterLocation] = useState(activeLocationFilter || "All");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Computer | null>(null);
  const [idInput, setIdInput] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize location filter if passed from parent
  useEffect(() => {
    if (activeLocationFilter) {
      setFilterLocation(activeLocationFilter);
    }
  }, [activeLocationFilter]);

  const handleSelectLocation = (loc: string) => {
    setFilterLocation(loc);
    setActiveLocationFilter?.(loc);
  };

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

  const filtered = data.computers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.cpu.toLowerCase().includes(q) ||
      c.os.toLowerCase().includes(q);

    const matchStatus = filterStatus === "All" || c.status === filterStatus;

    const matchLocation = filterLocation === "All" || (() => {
      const l = filterLocation.toLowerCase();
      const cloc = c.location.toLowerCase();
      if (l === "comlab") return cloc.includes("comlab");
      if (l === "shs lab") return cloc.includes("shs");
      if (l === "registrar") return cloc.includes("registrar") || cloc.includes("reg");
      if (l === "laboratory") return (cloc.includes("laboratory") || cloc.includes("lab")) && !cloc.includes("comlab") && !cloc.includes("shs");
      return cloc.includes(l);
    })();

    return matchSearch && matchStatus && matchLocation;
  });

  function openAdd(preferredRoom?: string) {
    setEditing(null);
    setIdInput("");
    const initialLocation = preferredRoom && preferredRoom !== "All" ? `${preferredRoom} — Seat 1` : "";
    setForm({ ...emptyForm(), location: initialLocation });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(c: Computer) {
    setEditing(c);
    setIdInput(c.id);
    setForm({
      name: c.name,
      location: c.location,
      cpu: c.cpu,
      ram: c.ram,
      storage: c.storage,
      gpu: c.gpu,
      os: c.os,
      status: c.status,
      dateAcquired: c.dateAcquired,
    });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    setFormError("");
    const targetId = editing ? editing.id : idInput.trim().toUpperCase();

    if (!targetId) {
      setFormError("Workstation ID is required (e.g. PC-COMLAB-01).");
      return;
    }
    if (!editing && data.computers.some(c => c.id === targetId)) {
      setFormError(`A computer with ID "${targetId}" already exists.`);
      return;
    }
    if (!form.location.trim()) {
      setFormError("Location / Room allocation is required.");
      return;
    }

    const payload: Computer = {
      ...form,
      id: targetId,
      name: form.name.trim() || targetId,
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await api.updateComputer(editing.id, payload).catch(() => payload);
        setData({ ...data, computers: data.computers.map(c => c.id === editing.id ? updated : c) });
        addLog("admin", "Admin", "Computer Updated", `Updated ${editing.id} (Status: ${form.status}) — ${form.location}`);
      } else {
        const created = await api.createComputer(payload).catch(() => payload);
        setData({ ...data, computers: [...data.computers, created] });
        addLog("admin", "Admin", "Computer Added", `Added ${targetId} at ${form.location}`);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save workstation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteComputer(id).catch(() => null);
      setData({
        ...data,
        computers: data.computers.filter(c => c.id !== id),
        problems: data.problems.filter(p => p.computerId !== id),
        maintenance: data.maintenance.filter(m => m.computerId !== id),
      });
      addLog("admin", "Admin", "Computer Deleted", `Deleted computer ${id} and associated records`);
    } finally {
      setDeleteConfirm(null);
      if (expandedId === id) setExpandedId(null);
    }
  }

  const f = "w-full bg-[#0a0f1d] border border-[#1e293b] rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#0ea5e9] transition-colors";
  const lbl = "block text-[11px] font-semibold text-[#94a3b8] mb-1 uppercase tracking-wider";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
            <button
              type="button"
              onClick={() => handleSelectLocation("All")}
              className={`transition-colors flex items-center gap-1.5 font-bold ${
                filterLocation !== "All"
                  ? "text-slate-400 hover:text-sky-400 cursor-pointer"
                  : "text-slate-300"
              }`}
            >
              <AppIcon name="computers" size={13} className={filterLocation !== "All" ? "text-slate-500" : "text-sky-400"} />
              <span>Computers</span>
            </button>
            {filterLocation !== "All" && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-sky-400 font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                  <AppIcon name={CAMPUS_LOCATIONS.find(l => l.id === filterLocation)?.icon || "computers"} size={12} />
                  <span>{filterLocation}</span>
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">Workstation Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0ea5e9]/15 text-[#38bdf8] border border-[#0ea5e9]/30">
              {data.computers.length} Units Enrolled
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Manage computer hardware configurations, campus room allocations, and operational health
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0f172a] border border-[#334155] rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "grid" ? "bg-[#0ea5e9] text-[#0b1329] shadow-md" : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <AppIcon name="grid" size={13} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === "table" ? "bg-[#0ea5e9] text-[#0b1329] shadow-md" : "text-[#94a3b8] hover:text-white"
              }`}
            >
              <AppIcon name="table" size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openAdd(filterLocation)}
            className="btn-primary"
          >
            <AppIcon name="plus" size={13} />
            <span>Add Workstation</span>
          </button>
        </div>
      </div>

      {/* Campus Location / Lab Department Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => handleSelectLocation("All")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            filterLocation === "All"
              ? "bg-[#0ea5e9] text-[#0b1329] shadow-md shadow-[#0ea5e9]/20 font-bold"
              : "bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#334155]"
          }`}
        >
          <AppIcon name="computers" size={14} />
          <span>All Workstations</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
            filterLocation === "All" ? "bg-[#0284c7] text-white" : "bg-[#1e293b] text-[#64748b]"
          }`}>
            {data.computers.length}
          </span>
        </button>

        {CAMPUS_LOCATIONS.map(loc => {
          const count = getLocationCount(loc.id);
          const isSelected = filterLocation === loc.id;

          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => handleSelectLocation(loc.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-[#0ea5e9] text-[#0b1329] shadow-md shadow-[#0ea5e9]/20 font-bold"
                  : "bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#334155]"
              }`}
              title={loc.fullName}
            >
              <AppIcon name={loc.icon} size={14} />
              <span>{loc.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isSelected ? "bg-[#0284c7] text-white" : "bg-[#1e293b] text-[#64748b]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <AppIcon name="search" size={13} className="absolute left-3 top-2.5 text-[#64748b]" />
          <input
            type="text"
            placeholder="Search by ID, name, specs, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#131d33] border border-[#334155] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#0ea5e9] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2 text-[#64748b] hover:text-white text-xs"
            >
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-[#131d33] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#0ea5e9] transition-colors"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="text-xs text-[#64748b] font-mono">
            Showing <strong className="text-white">{filtered.length}</strong> machines
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID / CARD VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => {
            const activeProblems = data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress"));
            const machineMaintenance = data.maintenance.filter(m => m.computerId === c.id);
            const isExpanded = expandedId === c.id;
            const badge = getLabBadge(c.location);

            return (
              <div
                key={c.id}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                className={`bg-[#0f172a] border rounded-xl p-5 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between ${
                  isExpanded
                    ? "border-[#0ea5e9] ring-1 ring-[#0ea5e9]/30"
                    : "border-[#1e293b] hover:border-[#334155]"
                }`}
              >
                <div>
                  {/* Card Top: Room Tag + ID + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                          <AppIcon name={badge.icon} size={11} />
                          <span>{badge.label}</span>
                        </span>
                        <span className="font-mono text-base font-bold text-white tracking-wide group-hover:text-[#38bdf8] transition-colors">
                          {c.id}
                        </span>
                      </div>
                      <div className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                        <AppIcon name="location" size={11} className="text-slate-500" />
                        <span className="truncate max-w-[200px]">{c.location}</span>
                      </div>
                    </div>
                    <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                  </div>

                  {/* Hardware Spec Chips */}
                  <div className="space-y-1.5 py-3 border-y border-[#1e293b]/80 my-3 text-xs">
                    <div className="flex items-center justify-between text-[#94a3b8]">
                      <span className="text-[#64748b] text-[11px]">Processor:</span>
                      <span className="font-medium text-white truncate max-w-[170px]" title={c.cpu}>{c.cpu}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#94a3b8]">
                      <span className="text-[#64748b] text-[11px]">RAM & Storage:</span>
                      <span className="font-mono text-[#cbd5e1]">{c.ram} · {c.storage}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#94a3b8]">
                      <span className="text-[#64748b] text-[11px]">OS:</span>
                      <span className="text-[#94a3b8]">{c.os}</span>
                    </div>
                  </div>

                  {/* Operational Health Signals */}
                  <div className="flex items-center gap-2 text-[11px] mb-4">
                    {activeProblems.length > 0 ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">
                        <AppIcon name="warning" size={11} />
                        <span>{activeProblems.length} Active Problem{activeProblems.length > 1 ? "s" : ""}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <AppIcon name="check" size={11} /> No active issues
                      </span>
                    )}
                    <span className="text-[#475569]">·</span>
                    <span className="text-[#64748b]">
                      {machineMaintenance.length} service records
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Quick Actions */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="text-[#38bdf8] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{isExpanded ? "Hide Details" : "Inspect Specs"}</span>
                    <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="px-2.5 py-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(c.id)}
                      className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: DENSE TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] border-b border-[#1e293b] text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Workstation ID</th>
                  <th className="px-5 py-3.5">Campus Room / Location</th>
                  <th className="px-5 py-3.5">Specs (CPU · RAM · Storage)</th>
                  <th className="px-5 py-3.5">OS</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Issues</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filtered.map(c => {
                  const activeProblems = data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress"));
                  const badge = getLabBadge(c.location);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="hover:bg-[#131d33] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                        {c.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            <AppIcon name={badge.icon} size={11} />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-[#94a3b8]">{c.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white">
                        <span className="font-semibold">{c.cpu}</span>
                        <span className="text-[#64748b] mx-1.5">/</span>
                        <span className="text-[#cbd5e1] font-mono">{c.ram}</span>
                        <span className="text-[#64748b] mx-1.5">/</span>
                        <span className="text-[#cbd5e1] font-mono">{c.storage}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[#94a3b8]">{c.os}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                      </td>
                      <td className="px-5 py-3.5">
                        {activeProblems.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AppIcon name="warning" size={10} />
                            <span>{activeProblems.length} Active</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] inline-flex items-center gap-1">
                            <AppIcon name="check" size={11} />
                            <span>Clear</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="px-2 py-1 rounded bg-[#1e293b] text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(c.id)}
                            className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-[#0f172a] border border-[#1e293b] rounded-xl p-8">
          <AppIcon name="search" size={36} className="mx-auto mb-3 text-slate-500" />
          <div className="text-base font-bold text-white mb-1">No workstations found</div>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-4">
            No computers match your current room selection "{filterLocation}" or search keyword.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterLocation("All"); setFilterStatus("All"); }}
            className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* SLIDING INSPECTION DRAWER */}
      {expandedId && (() => {
        const comp = data.computers.find(c => c.id === expandedId);
        if (!comp) return null;
        const compProblems = data.problems.filter(p => p.computerId === comp.id);
        const compMaintenance = data.maintenance.filter(m => m.computerId === comp.id);
        const badge = getLabBadge(comp.location);

        return (
          <div className="bg-[#0b1329] border border-[#0ea5e9]/40 rounded-xl p-6 shadow-xl shadow-black/50 relative animate-fadeIn">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1e293b]">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.color}`}>
                    <AppIcon name={badge.icon} size={13} />
                    <span>{badge.label}</span>
                  </span>
                  <h3 className="font-mono text-xl font-bold text-white">{comp.id}</h3>
                  <StatusBadge label={comp.status} variant={getComputerStatusVariant(comp.status)} />
                </div>
                <div className="text-xs text-[#94a3b8] mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <AppIcon name="location" size={11} className="text-slate-500" />
                    <span>{comp.location}</span>
                  </span>
                  <span>·</span>
                  <span>Enrolled: {comp.dateAcquired}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(comp)}
                  className="px-3 py-1.5 bg-[#0ea5e9] text-[#0b1329] text-xs font-bold rounded-lg hover:bg-[#38bdf8] transition-colors"
                >
                  Edit Workstation
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#1e293b] transition-colors"
                >
                  <AppIcon name="close" size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              {/* Hardware Spec Breakdown */}
              <div className="space-y-3 bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#38bdf8]">
                  Hardware Architecture
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#64748b] block text-[10px]">CPU</span>
                    <span className="font-semibold text-white">{comp.cpu}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">GPU</span>
                    <span className="text-[#94a3b8]">{comp.gpu || "Integrated Graphics"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#64748b] block text-[10px]">Memory</span>
                      <span className="font-mono text-white">{comp.ram}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10px]">Storage</span>
                      <span className="font-mono text-white">{comp.storage}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">Operating System</span>
                    <span className="text-[#94a3b8]">{comp.os}</span>
                  </div>
                </div>
              </div>

              {/* Reported Issues History */}
              <div className="space-y-3 bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
                    Incidents & Issues ({compProblems.length})
                  </h4>
                </div>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {compProblems.length === 0 ? (
                    <div className="text-[#64748b] italic py-3 text-center">No problem records</div>
                  ) : (
                    compProblems.map(p => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-[#131d33] border border-[#1e293b] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-[#38bdf8]">{p.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            p.status === "Open" ? "bg-rose-500/20 text-rose-300" :
                            p.status === "In Progress" ? "bg-amber-500/20 text-amber-300" :
                            "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[#94a3b8] text-[11px] line-clamp-2">{p.description}</p>
                        <div className="text-[10px] text-[#64748b]">By {p.reportedBy} on {p.dateReported}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-3 bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-sky-400">
                    Maintenance Jobs ({compMaintenance.length})
                  </h4>
                </div>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {compMaintenance.length === 0 ? (
                    <div className="text-[#64748b] italic py-3 text-center">No maintenance records</div>
                  ) : (
                    compMaintenance.map(m => (
                      <div key={m.id} className="p-2.5 rounded-lg bg-[#131d33] border border-[#1e293b] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-white font-semibold">{m.maintenanceType}</span>
                          <span className="text-[10px] font-mono text-[#94a3b8]">{m.scheduledDate}</span>
                        </div>
                        <p className="text-[#94a3b8] text-[11px] truncate">{m.activity}</p>
                        <div className="text-[10px] text-[#64748b]">Tech: {m.technician} · {m.status}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD / EDIT WORKSTATION MODAL */}
      {showModal && (
        <Modal
          title={editing ? `Edit Workstation: ${editing.id}` : "Enroll New Workstation"}
          subtitle="Define hardware configuration, network name, and campus room allocation"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AppIcon name="warning" size={13} />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Identification & Room */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">
                1. Identification &amp; Room Allocation
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Workstation ID *</label>
                  <input
                    className={`${f} font-mono uppercase`}
                    value={editing ? editing.id : idInput}
                    onChange={e => setIdInput(e.target.value)}
                    disabled={!!editing}
                    placeholder="e.g. PC-COMLAB-01"
                  />
                </div>
                <div>
                  <label className={lbl}>Friendly Name</label>
                  <input
                    className={f}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Row 1, Seat 9"
                  />
                </div>
              </div>

              {/* Campus Room Preset Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={lbl} style={{ marginBottom: 0 }}>Laboratory &amp; Room Allocation *</label>
                  <span className="text-[10px] text-[#64748b]">Quick Room Select:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {CAMPUS_LOCATIONS.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setForm({ ...form, location: `${loc.id} — Seat ` })}
                      className="px-2 py-1.5 rounded-lg bg-[#131d33] border border-[#334155] text-[11px] font-semibold text-[#38bdf8] hover:bg-[#1e293b] hover:border-[#0ea5e9] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <AppIcon name={loc.icon} size={12} />
                      <span>{loc.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  className={f}
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. ComLab — Row 1, Seat 1"
                />
              </div>
            </div>

            {/* Section 2: Hardware Specs */}
            <div className="space-y-3 pt-3 border-t border-[#1e293b]">
              <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">
                2. Hardware Specifications
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Processor (CPU)</label>
                  <select className={f} value={form.cpu} onChange={e => setForm({ ...form, cpu: e.target.value })}>
                    {CPU_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Graphics Card (GPU)</label>
                  <input className={f} value={form.gpu} onChange={e => setForm({ ...form, gpu: e.target.value })} placeholder="e.g. NVIDIA RTX 3060" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Memory (RAM)</label>
                  <select className={f} value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })}>
                    {RAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Storage Drive</label>
                  <select className={f} value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                    {STORAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: OS and Status */}
            <div className="space-y-3 pt-3 border-t border-[#1e293b]">
              <div className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider">
                3. Operating System &amp; Lifecycle
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Operating System</label>
                  <select className={f} value={form.os} onChange={e => setForm({ ...form, os: e.target.value })}>
                    {OS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Operational Status</label>
                  <select
                    className={f}
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as ComputerStatus })}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Acquisition / Enrollment Date</label>
                <input
                  type="date"
                  className={f}
                  value={form.dateAcquired}
                  onChange={e => setForm({ ...form, dateAcquired: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white text-xs font-bold rounded-xl hover:from-[#0369a1] hover:to-[#0284c7] disabled:opacity-50 transition-all shadow-md shadow-[#0284c7]/25"
              >
                {isSubmitting ? "Saving Workstation..." : editing ? "Save Changes" : "Enroll Workstation"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-[#334155] text-[#94a3b8] text-xs font-semibold rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <Modal title="Delete Workstation" subtitle="Permanent Removal from Inventory" onClose={() => setDeleteConfirm(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[#94a3b8]">
              Are you sure you want to delete workstation <span className="font-mono text-white font-bold">{deleteConfirm}</span>?
              All associated problem tickets and maintenance service records will be purged.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/25"
              >
                Delete Workstation
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 border border-[#334155] text-[#94a3b8] text-xs font-semibold rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
  if (l.includes("comlab")) return { label: "ComLab", icon: "comlab", color: "bg-indigo-50 text-[#28166F] border-indigo-200" };
  if (l.includes("shs")) return { label: "SHS Lab", icon: "shs", color: "bg-purple-50 text-purple-700 border-purple-200" };
  if (l.includes("registrar") || l.includes("reg")) return { label: "Registrar", icon: "registrar", color: "bg-indigo-50 text-[#28166F] border-indigo-200" };
  if (l.includes("laboratory") || l.includes("lab")) return { label: "Laboratory", icon: "laboratory", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { label: loc.split("—")[0]?.trim() || "Room", icon: "location", color: "bg-slate-100 text-slate-700 border-slate-200" };
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
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.cpu.toLowerCase().includes(q) ||
      c.ram.toLowerCase().includes(q) ||
      c.storage.toLowerCase().includes(q) ||
      c.os.toLowerCase().includes(q);

    const matchStatus = filterStatus === "All" || c.status === filterStatus;

    let matchLocation = true;
    if (filterLocation !== "All") {
      const l = filterLocation.toLowerCase();
      const cloc = c.location.toLowerCase();
      if (l === "comlab") matchLocation = cloc.includes("comlab");
      else if (l === "shs lab") matchLocation = cloc.includes("shs");
      else if (l === "registrar") matchLocation = cloc.includes("registrar") || cloc.includes("reg");
      else if (l === "laboratory") matchLocation = (cloc.includes("laboratory") || cloc.includes("lab")) && !cloc.includes("comlab") && !cloc.includes("shs");
      else matchLocation = cloc.includes(l);
    }

    return matchSearch && matchStatus && matchLocation;
  });

  function openAdd(locHint?: string) {
    setEditing(null);
    setIdInput("");
    let initialLoc = "";
    if (locHint && locHint !== "All") {
      initialLoc = `${locHint} — Row 1, Seat `;
    }
    setForm({ ...emptyForm(), location: initialLoc });
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

  const f = "w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] shadow-2xs transition-colors";
  const lbl = "block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider";

  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <button
              type="button"
              onClick={() => handleSelectLocation("All")}
              className={`transition-colors flex items-center gap-1.5 font-bold ${
                filterLocation !== "All"
                  ? "text-slate-500 hover:text-[#28166F] cursor-pointer"
                  : "text-slate-700"
              }`}
            >
              <AppIcon name="computers" size={13} className={filterLocation !== "All" ? "text-slate-400" : "text-[#28166F]"} />
              <span>Computers</span>
            </button>
            {filterLocation !== "All" && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[#28166F] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#28166F]/10 border border-[#28166F]/20">
                  <AppIcon name={CAMPUS_LOCATIONS.find(l => l.id === filterLocation)?.icon || "computers"} size={12} />
                  <span>{filterLocation}</span>
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Workstation Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#28166F]/10 text-[#28166F] border border-[#28166F]/20 font-mono">
              {data.computers.length} Units Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage computer hardware configurations, campus room allocations, and operational health
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid" ? "bg-[#28166F] text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <AppIcon name="grid" size={13} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table" ? "bg-[#28166F] text-white shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            filterLocation === "All"
              ? "bg-[#28166F] text-white shadow-xs font-bold"
              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <AppIcon name="computers" size={13} />
          <span>All Workstations</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            filterLocation === "All" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-[#28166F] text-white shadow-xs font-bold"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={loc.fullName}
            >
              <AppIcon name={loc.icon} size={13} />
              <span>{loc.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <AppIcon name="search" size={13} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, name, specs, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#28166F] focus:bg-white transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
            >
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:border-[#28166F] focus:bg-white transition-colors cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-900 font-bold">{filtered.length}</strong> machines
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID / CARD VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const activeProblems = data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress"));
            const machineMaintenance = data.maintenance.filter(m => m.computerId === c.id);
            const isExpanded = expandedId === c.id;
            const badge = getLabBadge(c.location);

            return (
              <div
                key={c.id}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                className={`bg-white border rounded-xl p-4 transition-all duration-200 cursor-pointer relative group flex flex-col justify-between shadow-xs hover:shadow-sm ${
                  isExpanded
                    ? "border-[#28166F] ring-1 ring-[#28166F]/25"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Top: Room Tag + ID + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                          <AppIcon name={badge.icon} size={11} />
                          <span>{badge.label}</span>
                        </span>
                        <span className="font-mono text-base font-bold text-slate-900 tracking-tight group-hover:text-[#28166F] transition-colors">
                          {c.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <AppIcon name="location" size={11} className="text-slate-500" />
                        <span className="truncate max-w-[200px]">{c.location}</span>
                      </div>
                    </div>
                    <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                  </div>

                  {/* Hardware Spec Chips */}
                  <div className="space-y-1 py-2.5 border-y border-slate-100 my-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium">Processor:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={c.cpu}>{c.cpu}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium">RAM &amp; Storage:</span>
                      <span className="font-mono font-medium text-slate-700">{c.ram} · {c.storage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium">OS:</span>
                      <span className="text-slate-600 font-medium">{c.os}</span>
                    </div>
                  </div>

                  {/* Operational Health Signals */}
                  <div className="flex items-center gap-2 text-[11px] mb-3">
                    {activeProblems.length > 0 ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        <AppIcon name="warning" size={11} />
                        <span>{activeProblems.length} Active Problem{activeProblems.length > 1 ? "s" : ""}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <AppIcon name="check" size={11} /> Healthy
                      </span>
                    )}
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">
                      {machineMaintenance.length} service records
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Quick Actions */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="text-[#28166F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Details" : "Inspect Specs"}</span>
                    <span className="text-[10px]">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(c.id)}
                      className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors cursor-pointer"
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3">Workstation ID</th>
                  <th className="px-5 py-3">Campus Room / Location</th>
                  <th className="px-5 py-3">Specs (CPU · RAM · Storage)</th>
                  <th className="px-5 py-3">OS</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Issues</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const activeProblems = data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress"));
                  const badge = getLabBadge(c.location);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 group-hover:text-[#28166F] transition-colors">
                        {c.id}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            <AppIcon name={badge.icon} size={11} />
                            <span>{badge.label}</span>
                          </span>
                          <span className="text-slate-600 font-medium">{c.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-800">
                        <span className="font-semibold">{c.cpu}</span>
                        <span className="text-slate-300 mx-1.5">/</span>
                        <span className="text-slate-600 font-mono">{c.ram}</span>
                        <span className="text-slate-300 mx-1.5">/</span>
                        <span className="text-slate-600 font-mono">{c.storage}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">{c.os}</td>
                      <td className="px-5 py-3">
                        <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                      </td>
                      <td className="px-5 py-3">
                        {activeProblems.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AppIcon name="warning" size={10} />
                            <span>{activeProblems.length} Active</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold inline-flex items-center gap-1">
                            <AppIcon name="check" size={11} />
                            <span>Clear</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(c.id)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors cursor-pointer"
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
        <div className="text-center py-16 bg-white border border-slate-200 shadow-xs rounded-xl p-8">
          <AppIcon name="search" size={32} className="mx-auto mb-2.5 text-slate-400" />
          <div className="text-base font-serif font-bold text-slate-900 mb-1">No workstations found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-medium">
            No computers match your current room selection "{filterLocation}" or search keyword.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterLocation("All"); setFilterStatus("All"); }}
            className="btn-secondary"
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-md relative animate-pageFadeSlide">
            <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.color}`}>
                    <AppIcon name={badge.icon} size={13} />
                    <span>{badge.label}</span>
                  </span>
                  <h3 className="font-mono text-xl font-bold text-slate-900">{comp.id}</h3>
                  <StatusBadge label={comp.status} variant={getComputerStatusVariant(comp.status)} />
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <AppIcon name="location" size={11} className="text-slate-400" />
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
                  className="btn-primary"
                >
                  Edit Workstation
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <AppIcon name="close" size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
              {/* Hardware Spec Breakdown */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#28166F]">
                  Hardware Architecture
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">CPU</span>
                    <span className="font-bold text-slate-900">{comp.cpu}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">GPU</span>
                    <span className="text-slate-700 font-medium">{comp.gpu || "Integrated Graphics"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Memory</span>
                      <span className="font-mono font-bold text-slate-900">{comp.ram}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium">Storage</span>
                      <span className="font-mono font-bold text-slate-900">{comp.storage}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-medium">Operating System</span>
                    <span className="text-slate-700 font-medium">{comp.os}</span>
                  </div>
                </div>
              </div>

              {/* Reported Issues History */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-rose-700">
                    Incidents &amp; Issues ({compProblems.length})
                  </h4>
                </div>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {compProblems.length === 0 ? (
                    <div className="text-slate-500 italic py-3 text-center">No problem records</div>
                  ) : (
                    compProblems.map(p => (
                      <div key={p.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#28166F]">{p.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            p.status === "Open" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            p.status === "In Progress" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium line-clamp-2">{p.description}</p>
                        <div className="text-[10px] text-slate-500 font-medium">By {p.reportedBy} on {p.dateReported}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-[#28166F]">
                    Maintenance Jobs ({compMaintenance.length})
                  </h4>
                </div>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {compMaintenance.length === 0 ? (
                    <div className="text-slate-500 italic py-3 text-center">No maintenance records</div>
                  ) : (
                    compMaintenance.map(m => (
                      <div key={m.id} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-900 font-bold">{m.maintenanceType}</span>
                          <span className="text-[10px] font-mono font-bold text-[#28166F]">{m.scheduledDate}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] font-medium truncate">{m.activity}</p>
                        <div className="text-[10px] text-slate-500 font-medium">Tech: {m.technician} · {m.status}</div>
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AppIcon name="warning" size={13} className="text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Identification & Room */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#28166F] uppercase tracking-wider">
                1. Identification &amp; Room Allocation
              </div>

              <div className="grid grid-cols-2 gap-3.5">
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
                  <span className="text-[10px] text-slate-500 font-medium">Quick Room Select:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {CAMPUS_LOCATIONS.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setForm({ ...form, location: `${loc.id} — Seat ` })}
                      className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold text-[#28166F] hover:bg-[#28166F] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
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
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-bold text-[#28166F] uppercase tracking-wider">
                2. Hardware Specifications
              </div>
              <div className="grid grid-cols-2 gap-3.5">
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

              <div className="grid grid-cols-2 gap-3.5">
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
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-bold text-[#28166F] uppercase tracking-wider">
                3. Operating System &amp; Lifecycle
              </div>
              <div className="grid grid-cols-2 gap-3.5">
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
            <div className="flex gap-3 pt-3.5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="btn-primary flex-1 py-2.5"
              >
                {isSubmitting ? "Saving Workstation..." : editing ? "Save Changes" : "Enroll Workstation"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary px-4 py-2.5"
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
          <div className="space-y-4 text-slate-800">
            <p className="text-sm">
              Are you sure you want to delete workstation <span className="font-mono text-slate-900 font-bold">{deleteConfirm}</span>?
              All associated problem tickets and maintenance service records will be purged.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-destructive flex-1 py-2.5"
              >
                Delete Workstation
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary px-4 py-2.5"
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

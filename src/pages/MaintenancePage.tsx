import React, { useState } from "react";
import { MAINTENANCE_STATUS_FLOW, MAINTENANCE_TYPES, generateId, todayDate } from "../data";
import type { AppData, Maintenance, MaintenanceStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getMaintenanceStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";
import { AppIcon } from "../components/Icons";
import { api } from "../api";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
}

const ALL_STATUSES: MaintenanceStatus[] = ["Scheduled", "In Progress", "Completed", "Cancelled"];

const emptyForm = (): Omit<Maintenance, "id"> => ({
  computerId: "",
  maintenanceType: "Preventive Cleaning",
  activity: "",
  technician: "",
  scheduledDate: todayDate(),
  completedDate: undefined,
  status: "Scheduled",
  notes: "",
});

const TECHNICIAN_PRESETS = [
  "IT Support Team",
  "Engr. Santos",
  "Engr. Ramirez",
  "Lab Custodian",
  "System Admin",
];

export default function MaintenancePage({ data, setData, addLog }: Props) {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterComputer, setFilterComputer] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState<Omit<Maintenance, "id">>({ ...emptyForm(), computerId: data.computers[0]?.id || "" });
  const [formError, setFormError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statistics
  const scheduledCount = data.maintenance.filter(m => m.status === "Scheduled").length;
  const inProgressCount = data.maintenance.filter(m => m.status === "In Progress").length;
  const completedCount = data.maintenance.filter(m => m.status === "Completed").length;
  const cancelledCount = data.maintenance.filter(m => m.status === "Cancelled").length;

  const filtered = data.maintenance.filter(m => {
    const matchStatus = filterStatus === "All" || m.status === filterStatus;
    const matchComputer = filterComputer === "All" || m.computerId === filterComputer;
    const matchType = filterType === "All" || m.maintenanceType === filterType;
    const matchSearch =
      !search ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.computerId.toLowerCase().includes(search.toLowerCase()) ||
      m.activity.toLowerCase().includes(search.toLowerCase()) ||
      m.technician.toLowerCase().includes(search.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()));

    return matchStatus && matchComputer && matchType && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  function openAdd(prefillComputerId?: string) {
    setEditing(null);
    setForm({
      ...emptyForm(),
      computerId: prefillComputerId || data.computers[0]?.id || "",
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(m: Maintenance) {
    setEditing(m);
    setForm({
      computerId: m.computerId,
      maintenanceType: m.maintenanceType,
      activity: m.activity,
      technician: m.technician,
      scheduledDate: m.scheduledDate,
      completedDate: m.completedDate || (m.status === "Completed" ? todayDate() : undefined),
      status: m.status,
      notes: m.notes || "",
    });
    setFormError("");
    setShowModal(true);
  }

  async function syncComputerStatus(computerId: string, newMaintenanceList: Maintenance[], currentComputers: typeof data.computers) {
    const comp = currentComputers.find(c => c.id === computerId);
    if (!comp || comp.status === "Decommissioned") return currentComputers;

    const hasActiveProblems = data.problems.some(
      p => p.computerId === computerId && (p.status === "Open" || p.status === "In Progress")
    );
    const hasActiveMaintenance = newMaintenanceList.some(
      m => m.computerId === computerId && (m.status === "Scheduled" || m.status === "In Progress")
    );

    let nextStatus = comp.status;
    if (hasActiveProblems) {
      nextStatus = "Needs Maintenance";
    } else if (hasActiveMaintenance) {
      nextStatus = "Under Repair";
    } else {
      nextStatus = "Active";
    }

    if (nextStatus !== comp.status) {
      const updatedComp = { ...comp, status: nextStatus };
      await api.updateComputer(comp.id, updatedComp).catch(() => null);
      return currentComputers.map(c => c.id === comp.id ? updatedComp : c);
    }
    return currentComputers;
  }

  async function handleSave() {
    setFormError("");
    if (!form.computerId) {
      setFormError("Target computer selection is required.");
      return;
    }
    if (!form.activity.trim()) {
      setFormError("Maintenance activity description is required.");
      return;
    }
    if (!form.technician.trim()) {
      setFormError("Assigned technician or team name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload: Maintenance = {
          ...editing,
          computerId: form.computerId,
          maintenanceType: form.maintenanceType,
          activity: form.activity.trim(),
          technician: form.technician.trim(),
          scheduledDate: form.scheduledDate,
          completedDate: form.status === "Completed" ? (form.completedDate || todayDate()) : undefined,
          status: form.status,
          notes: form.notes?.trim() || "",
        };
        const updated = await api.updateMaintenance(editing.id, payload).catch(() => payload);
        const updatedMaintenance = data.maintenance.map(m => m.id === editing.id ? updated : m);
        const updatedComputers = await syncComputerStatus(form.computerId, updatedMaintenance, data.computers);
        setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
        addLog("admin", "Admin", "Maintenance Updated", `Updated ${editing.id} on ${form.computerId} (${form.status})`);
      } else {
        const id = generateId("MNT", data.maintenance);
        const payload: Maintenance = {
          id,
          computerId: form.computerId,
          maintenanceType: form.maintenanceType,
          activity: form.activity.trim(),
          technician: form.technician.trim(),
          scheduledDate: form.scheduledDate,
          completedDate: form.status === "Completed" ? (form.completedDate || todayDate()) : undefined,
          status: form.status,
          notes: form.notes?.trim() || "",
        };
        const created = await api.createMaintenance(payload).catch(() => payload);
        const updatedMaintenance = [created, ...data.maintenance];
        const updatedComputers = await syncComputerStatus(form.computerId, updatedMaintenance, data.computers);
        setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
        addLog("admin", "Admin", "Maintenance Scheduled", `Scheduled ${form.maintenanceType} for ${form.computerId} on ${form.scheduledDate}`);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save maintenance record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMaintenance(id).catch(() => null);
      const target = data.maintenance.find(m => m.id === id);
      const remainingMaintenance = data.maintenance.filter(m => m.id !== id);
      const updatedComputers = target
        ? await syncComputerStatus(target.computerId, remainingMaintenance, data.computers)
        : data.computers;
      setData({ ...data, maintenance: remainingMaintenance, computers: updatedComputers });
      addLog("admin", "Admin", "Maintenance Deleted", `Deleted maintenance record ${id}`);
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function advanceStatus(m: Maintenance) {
    const next = MAINTENANCE_STATUS_FLOW[m.status];
    if (!next) return;
    const updates: Partial<Maintenance> = { status: next };
    if (next === "Completed") updates.completedDate = todayDate();
    try {
      await api.updateMaintenance(m.id, updates).catch(() => null);
      const updatedMaintenance: Maintenance[] = data.maintenance.map(x => x.id === m.id ? { ...x, ...updates } : x);
      const updatedComputers = await syncComputerStatus(m.computerId, updatedMaintenance, data.computers);
      setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
      addLog("admin", "Admin", `Maintenance ${next}`, `${m.id} on ${m.computerId}: ${m.status} → ${next}`);
    } catch {
      // Fallback
    }
  }

  async function cancelMaintenance(m: Maintenance) {
    try {
      await api.updateMaintenance(m.id, { status: "Cancelled" }).catch(() => null);
      const updatedMaintenance: Maintenance[] = data.maintenance.map(x => x.id === m.id ? { ...x, status: "Cancelled" as MaintenanceStatus } : x);
      const updatedComputers = await syncComputerStatus(m.computerId, updatedMaintenance, data.computers);
      setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
      addLog("admin", "Admin", "Maintenance Cancelled", `Cancelled ${m.id} on ${m.computerId}`);
    } catch {
      // Fallback
    }
  }

  const f = "w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] shadow-2xs transition-colors";
  const lbl = "block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1";

  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Maintenance Operations</h1>
          </div>
          <p className="text-xs text-slate-500">
            Schedule, coordinate, and certify preventive servicing and repairs across campus labs.
          </p>
        </div>

        <button
          onClick={() => openAdd()}
          className="btn-primary"
        >
          <AppIcon name="plus" size={13} />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scheduled</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#28166F] flex items-center justify-center border border-indigo-200/80">
              <AppIcon name="calendar" size={15} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-slate-900">{scheduledCount}</span>
            <span className="text-xs text-[#28166F] font-semibold">Awaiting service</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AppIcon name="bolt" size={15} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-slate-900">{inProgressCount}</span>
            <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Active on bench
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <AppIcon name="check" size={15} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-slate-900">{completedCount}</span>
            <span className="text-xs text-emerald-700 font-semibold">Certified done</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cancelled</span>
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200">
              <AppIcon name="close" size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-slate-700">{cancelledCount}</span>
            <span className="text-xs text-slate-500 font-medium">Archived jobs</span>
          </div>
        </div>
      </div>

      {/* Workflow Legend */}
      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Life Cycle:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-[#28166F] font-bold text-[10px]">1. Scheduled</span>
            <span className="text-slate-300">→</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">2. In Progress</span>
            <span className="text-slate-300">→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">3. Completed</span>
          </div>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">
          Advancing maintenance status automatically synchronizes the linked computer's health status.
        </span>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white border border-slate-200 shadow-xs p-3.5 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === "All"
                ? "bg-[#28166F] text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All ({data.maintenance.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = data.maintenance.filter(m => m.status === s).length;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-[#28166F] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{s}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <AppIcon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#28166F] focus:bg-white transition-colors cursor-pointer"
          >
            <option value="All">All Types</option>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterComputer}
            onChange={e => setFilterComputer(e.target.value)}
            className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#28166F] focus:bg-white transition-colors max-w-[140px] cursor-pointer"
          >
            <option value="All">All Workstations</option>
            {data.computers.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Workstation</th>
                <th className="px-4 py-3">Type &amp; Activity</th>
                <th className="px-4 py-3">Assigned Tech</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(m => {
                const computer = data.computers.find(c => c.id === m.computerId);
                const nextStatus = MAINTENANCE_STATUS_FLOW[m.status];
                const isExpanded = expandedId === m.id;
                const isOverdue = m.status === "Scheduled" && m.scheduledDate < todayDate();

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className={`group hover:bg-slate-50/70 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50/90" : ""
                      }`}
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-3 text-slate-500">
                        <span className={`inline-block transition-transform duration-200 text-xs font-bold ${isExpanded ? "rotate-90 text-[#28166F]" : "group-hover:text-slate-600"}`}>
                          ›
                        </span>
                      </td>

                      {/* Computer ID & Lab */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#28166F] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                            {m.computerId}
                          </span>
                        </div>
                        {computer && (
                          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                            <AppIcon name="location" size={11} className="text-slate-500" />
                            <span>{computer.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Maintenance Type & Activity */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 mb-0.5">
                          {m.maintenanceType}
                        </div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-[#28166F] transition-colors line-clamp-1">
                          {m.activity}
                        </div>
                        {m.notes && (
                          <div className="text-[11px] text-slate-500 italic truncate mt-0.5">
                            "{m.notes}"
                          </div>
                        )}
                      </td>

                      {/* Assigned Tech */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-[#28166F] text-[10px] font-bold flex items-center justify-center uppercase">
                            {m.technician.slice(0, 2)}
                          </div>
                          <span className="text-xs text-slate-800 font-semibold">{m.technician}</span>
                        </div>
                      </td>

                      {/* Scheduled / Completed dates */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-800">{m.scheduledDate}</span>
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                              Overdue
                            </span>
                          )}
                        </div>
                        {m.completedDate && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1 font-semibold">
                            <AppIcon name="check" size={11} className="text-emerald-600" />
                            <span>Done: {m.completedDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {nextStatus && (
                            <button
                              onClick={() => advanceStatus(m)}
                              className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all shadow-2xs cursor-pointer ${
                                nextStatus === "In Progress"
                                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              → {nextStatus}
                            </button>
                          )}

                          <button
                            onClick={() => openEdit(m)}
                            title="Edit Record"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <AppIcon name="pencil" size={13} />
                          </button>

                          {m.status !== "Cancelled" && m.status !== "Completed" && (
                            <button
                              onClick={() => cancelMaintenance(m)}
                              title="Cancel Job"
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            >
                              <AppIcon name="close" size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            title="Delete Record"
                            className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <AppIcon name="close" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                                Full Activity Specification
                              </span>
                              <p className="text-slate-800 font-semibold leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                {m.activity}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                                Technician Field Notes
                              </span>
                              <div className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs min-h-[50px] font-medium">
                                {m.notes ? m.notes : <span className="text-slate-500 italic">No field notes recorded yet.</span>}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                                Hardware Context
                              </span>
                              {computer ? (
                                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1 text-slate-700 font-medium">
                                  <div><span className="text-slate-500">Specs:</span> {computer.cpu} · {computer.ram}</div>
                                  <div><span className="text-slate-500">Storage:</span> {computer.storage} · OS: {computer.os}</div>
                                  <div><span className="text-slate-500">Current Health:</span> <span className="font-bold text-slate-900">{computer.status}</span></div>
                                </div>
                              ) : (
                                <div className="text-slate-500 italic p-3 bg-white rounded-lg border border-slate-200">Computer record not found.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-500">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2.5 text-slate-500">
                      <AppIcon name="maintenance" size={20} className="text-slate-500" />
                    </div>
                    <div className="font-serif font-bold text-slate-900 text-sm">No maintenance jobs matching criteria</div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Try resetting the status filter or search parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule / Edit Modal */}
      {showModal && (
        <Modal
          title={editing ? `Edit Service Job: ${editing.id}` : "Schedule Maintenance"}
          subtitle={editing ? `Update service status or notes for ${editing.computerId}` : "Assign routine preventive cleaning or repairs to a workstation"}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AppIcon name="warning" size={14} className="text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className={lbl}>Target Workstation *</label>
              {data.computers.length === 0 ? (
                <div className="text-xs text-rose-700 p-2 bg-rose-50 border border-rose-200 rounded">
                  No computers registered yet. Please register a computer first.
                </div>
              ) : (
                <select
                  className={f}
                  value={form.computerId}
                  onChange={e => setForm({ ...form, computerId: e.target.value })}
                >
                  {data.computers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.location} ({c.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lbl}>Maintenance Type</label>
                <select
                  className={f}
                  value={form.maintenanceType}
                  onChange={e => setForm({ ...form, maintenanceType: e.target.value })}
                >
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={lbl}>Job Status</label>
                <select
                  className={f}
                  value={form.status}
                  onChange={e => {
                    const nextSt = e.target.value as MaintenanceStatus;
                    setForm({
                      ...form,
                      status: nextSt,
                      completedDate: nextSt === "Completed" ? (form.completedDate || todayDate()) : undefined,
                    });
                  }}
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={lbl}>Activity Description *</label>
              <input
                className={f}
                value={form.activity}
                onChange={e => setForm({ ...form, activity: e.target.value })}
                placeholder="e.g. Deep dust blowing, thermal paste renewal, RAM benchmark test"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={lbl} style={{ marginBottom: 0 }}>Assigned Technician *</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                  {TECHNICIAN_PRESETS.slice(0, 3).map(tech => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setForm({ ...form, technician: tech })}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-[#28166F] font-bold hover:bg-[#28166F] hover:text-white transition-colors cursor-pointer"
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
              <input
                className={f}
                value={form.technician}
                onChange={e => setForm({ ...form, technician: e.target.value })}
                placeholder="Technician or Team Name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={lbl}>Scheduled Date</label>
                <input
                  type="date"
                  className={f}
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>

              {form.status === "Completed" && (
                <div>
                  <label className={lbl}>Completed Date</label>
                  <input
                    type="date"
                    className={f}
                    value={form.completedDate || todayDate()}
                    onChange={e => setForm({ ...form, completedDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={lbl}>Technician Notes &amp; Observations</label>
              <textarea
                className={`${f} resize-none h-20`}
                value={form.notes || ""}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Observed fan vibration, re-seated GPU cables, verified all USB ports..."
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="btn-primary flex-1 py-2.5"
              >
                {isSubmitting ? "Saving to Database..." : editing ? "Save Changes" : "Confirm Schedule"}
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

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <Modal title="Delete Maintenance Record" subtitle="Confirm permanent deletion" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-slate-700">
            Are you sure you want to delete maintenance record <span className="font-mono text-slate-900 font-bold">{deleteConfirm}</span>? This action cannot be reversed.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="btn-destructive flex-1 py-2.5"
            >
              Delete Record
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-secondary px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

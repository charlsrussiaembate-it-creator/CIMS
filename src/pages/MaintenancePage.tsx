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

    const hasActiveMaintenance = newMaintenanceList.some(
      m => m.computerId === computerId && (m.status === "Scheduled" || m.status === "In Progress")
    );
    const hasActiveProblems = data.problems.some(
      p => p.computerId === computerId && (p.status === "Open" || p.status === "In Progress")
    );

    let newStatus: typeof comp.status | null = null;
    if (!hasActiveMaintenance && !hasActiveProblems && (comp.status === "Needs Maintenance" || comp.status === "Under Repair")) {
      newStatus = "Active";
    } else if (hasActiveMaintenance) {
      const isRepairing = newMaintenanceList.some(
        m => m.computerId === computerId && m.status === "In Progress"
      );
      newStatus = isRepairing ? "Under Repair" : "Needs Maintenance";
    }

    if (newStatus && newStatus !== comp.status) {
      await api.updateComputer(computerId, { status: newStatus }).catch(() => null);
      addLog("admin", "Admin", "Computer Status Updated", `${computerId} status set to ${newStatus}`);
      return currentComputers.map(c => c.id === computerId ? { ...c, status: newStatus! } : c);
    }
    return currentComputers;
  }

  async function handleSave() {
    setFormError("");
    if (!form.computerId) {
      setFormError("Please select a target computer.");
      return;
    }
    if (!form.activity.trim()) {
      setFormError("Activity description is required.");
      return;
    }
    if (!form.technician.trim()) {
      setFormError("Technician name is required.");
      return;
    }

    const payload = {
      ...form,
      completedDate: form.status === "Completed" ? (form.completedDate || todayDate()) : undefined,
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await api.updateMaintenance(editing.id, payload).catch(() => ({ ...editing, ...payload }));
        const updatedMaintenance = data.maintenance.map(m => m.id === editing.id ? { ...m, ...updated } : m);
        const updatedComputers = await syncComputerStatus(payload.computerId, updatedMaintenance, data.computers);
        setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
        addLog("admin", "Admin", "Maintenance Updated", `Updated ${editing.id} on ${editing.computerId} (${payload.status})`);
      } else {
        const id = generateId("MNT", data.maintenance);
        const newM: Maintenance = { id, ...payload };
        const saved = await api.createMaintenance(newM).catch(() => newM);
        const updatedMaintenance = [saved, ...data.maintenance];
        const updatedComputers = await syncComputerStatus(payload.computerId, updatedMaintenance, data.computers);
        setData({ ...data, maintenance: updatedMaintenance, computers: updatedComputers });
        addLog("admin", "Admin", "Maintenance Scheduled", `Scheduled ${id} — ${payload.maintenanceType} on ${payload.computerId}`);
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
      const targetMaint = data.maintenance.find(m => m.id === id);
      const remainingMaintenance = data.maintenance.filter(m => m.id !== id);
      const updatedComputers = targetMaint
        ? await syncComputerStatus(targetMaint.computerId, remainingMaintenance, data.computers)
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

  const f = "w-full bg-[#0a0f1d] border border-[#1e293b] rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors";
  const lbl = "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance Operations</h1>
          </div>
          <p className="text-sm text-slate-400">
            Schedule, coordinate, and certify preventive servicing and repairs across campus labs.
          </p>
        </div>

        <button
          onClick={() => openAdd()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Maintenance
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-sky-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled</span>
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <AppIcon name="calendar" size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{scheduledCount}</span>
            <span className="text-xs text-sky-400 font-medium">Awaiting service</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AppIcon name="bolt" size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{inProgressCount}</span>
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Active on bench
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <AppIcon name="check" size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{completedCount}</span>
            <span className="text-xs text-emerald-400 font-medium">Certified done</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cancelled</span>
            <span className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
              <AppIcon name="close" size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-300">{cancelledCount}</span>
            <span className="text-xs text-slate-500 font-medium">Archived jobs</span>
          </div>
        </div>
      </div>

      {/* Workflow Legend */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Standard Life Cycle:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-medium text-[11px]">1. Scheduled</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium text-[11px]">2. In Progress</span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-[11px]">3. Completed</span>
          </div>
        </div>
        <span className="text-slate-500 text-[11px] hidden sm:inline">
          Advancing maintenance status automatically updates the linked computer's health status.
        </span>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterStatus("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filterStatus === "All"
                ? "bg-sky-500 text-slate-950 font-semibold shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <span>{s}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? "bg-slate-900 text-slate-200" : "bg-slate-800 text-slate-400"
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
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="All">All Types</option>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filterComputer}
            onChange={e => setFilterComputer(e.target.value)}
            className="bg-[#0a0f1d] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500 max-w-[140px]"
          >
            <option value="All">All Workstations</option>
            {data.computers.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Workstation</th>
                <th className="px-4 py-3">Type & Activity</th>
                <th className="px-4 py-3">Assigned Tech</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map(m => {
                const computer = data.computers.find(c => c.id === m.computerId);
                const nextStatus = MAINTENANCE_STATUS_FLOW[m.status];
                const isExpanded = expandedId === m.id;
                const isOverdue = m.status === "Scheduled" && m.scheduledDate < todayDate();

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className={`group hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-800/30" : ""
                      }`}
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-3.5 text-slate-500">
                        <span className={`inline-block transition-transform duration-200 text-xs ${isExpanded ? "rotate-90 text-sky-400" : "group-hover:text-slate-300"}`}>
                          ›
                        </span>
                      </td>

                      {/* Computer ID & Lab */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                            {m.computerId}
                          </span>
                        </div>
                        {computer && (
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <AppIcon name="location" size={11} className="text-slate-500" />
                            <span>{computer.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Maintenance Type & Activity */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-300 mb-1">
                          {m.maintenanceType}
                        </div>
                        <div className="text-sm font-semibold text-white group-hover:text-sky-200 transition-colors line-clamp-1">
                          {m.activity}
                        </div>
                        {m.notes && (
                          <div className="text-[11px] text-slate-500 italic truncate mt-0.5">
                            "{m.notes}"
                          </div>
                        )}
                      </td>

                      {/* Assigned Tech */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center uppercase">
                            {m.technician.slice(0, 2)}
                          </div>
                          <span className="text-xs text-slate-200 font-medium">{m.technician}</span>
                        </div>
                      </td>

                      {/* Scheduled / Completed dates */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-slate-300">{m.scheduledDate}</span>
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        {m.completedDate && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                            <AppIcon name="check" size={11} className="text-emerald-400" />
                            <span>Finished: {m.completedDate}</span>
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {nextStatus && (
                            <button
                              onClick={() => advanceStatus(m)}
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all shadow-sm ${
                                nextStatus === "In Progress"
                                  ? "bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-slate-950"
                                  : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                              }`}
                            >
                              → {nextStatus}
                            </button>
                          )}

                          <button
                            onClick={() => openEdit(m)}
                            title="Edit Record"
                            className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {m.status !== "Cancelled" && m.status !== "Completed" && (
                            <button
                              onClick={() => cancelMaintenance(m)}
                              title="Cancel Job"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable row */}
                    {isExpanded && (
                      <tr className="bg-slate-950/40 border-b border-slate-800">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
                                Full Activity Specification
                              </span>
                              <p className="text-slate-200 font-medium leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                                {m.activity}
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
                                Technician Field Notes
                              </span>
                              <div className="text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 min-h-[50px]">
                                {m.notes ? m.notes : <span className="text-slate-600 italic">No field notes recorded yet.</span>}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">
                                Hardware Context
                              </span>
                              {computer ? (
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-slate-300">
                                  <div><span className="text-slate-500">Specs:</span> {computer.cpu} · {computer.ram}</div>
                                  <div><span className="text-slate-500">Storage:</span> {computer.storage} · OS: {computer.os}</div>
                                  <div><span className="text-slate-500">Current Health:</span> <span className="font-semibold text-white">{computer.status}</span></div>
                                </div>
                              ) : (
                                <div className="text-slate-500 italic p-3">Computer record not found.</div>
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
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <AppIcon name="maintenance" size={24} className="text-slate-400" />
                    </div>
                    <div className="font-medium text-slate-300">No maintenance jobs matching criteria</div>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search parameters.</p>
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
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className={lbl}>Target Workstation *</label>
              {data.computers.length === 0 ? (
                <div className="text-xs text-red-400 p-2 bg-red-500/10 rounded">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className={lbl} style={{ marginBottom: 0 }}>Assigned Technician *</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500">Presets:</span>
                  {TECHNICIAN_PRESETS.slice(0, 3).map(tech => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setForm({ ...form, technician: tech })}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className={lbl}>Technician Notes & Observations</label>
              <textarea
                className={`${f} resize-none h-20`}
                value={form.notes || ""}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Observed fan vibration, re-seated GPU cables, verified all USB ports..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold rounded-lg shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Saving to Database..." : editing ? "Save Changes" : "Confirm Schedule"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-slate-800 text-slate-400 text-sm rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
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
          <p className="text-sm text-slate-300">
            Are you sure you want to delete maintenance record <span className="font-mono text-sky-400 font-bold">{deleteConfirm}</span>? This action cannot be reversed.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-500/20 transition-all"
            >
              Delete Record
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 border border-slate-800 text-slate-400 text-sm rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

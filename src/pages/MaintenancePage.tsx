import { useState } from "react";
import { MAINTENANCE_STATUS_FLOW, MAINTENANCE_TYPES, generateId, todayDate } from "../data";
import type { AppData, Maintenance, MaintenanceStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getMaintenanceStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";
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

export default function MaintenancePage({ data, setData, addLog }: Props) {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterComputer, setFilterComputer] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [form, setForm] = useState<Omit<Maintenance, "id">>({ ...emptyForm(), computerId: data.computers[0]?.id || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = data.maintenance.filter(m => {
    const matchStatus = filterStatus === "All" || m.status === filterStatus;
    const matchComputer = filterComputer === "All" || m.computerId === filterComputer;
    return matchStatus && matchComputer;
  });

  const sorted = [...filtered].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm(), computerId: data.computers[0]?.id || "" });
    setShowModal(true);
  }

  function openEdit(m: Maintenance) {
    setEditing(m);
    setForm({ computerId: m.computerId, maintenanceType: m.maintenanceType, activity: m.activity, technician: m.technician, scheduledDate: m.scheduledDate, completedDate: m.completedDate, status: m.status, notes: m.notes || "" });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.activity.trim() || !form.technician.trim()) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await api.updateMaintenance(editing.id, form).catch(() => ({ ...editing, ...form }));
        setData({ ...data, maintenance: data.maintenance.map(m => m.id === editing.id ? { ...m, ...updated } : m) });
        addLog("admin", "Admin", "Maintenance Updated", `Updated ${editing.id} on ${editing.computerId}`);
      } else {
        const id = generateId("MNT", data.maintenance);
        const newM: Maintenance = { id, ...form };
        const saved = await api.createMaintenance(newM).catch(() => newM);
        setData({ ...data, maintenance: [saved, ...data.maintenance] });
        addLog("admin", "Admin", "Maintenance Scheduled", `Scheduled ${id} — ${form.maintenanceType} on ${form.computerId} for ${form.scheduledDate}`);
      }
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMaintenance(id).catch(() => null);
      setData({ ...data, maintenance: data.maintenance.filter(m => m.id !== id) });
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
      setData({ ...data, maintenance: data.maintenance.map(x => x.id === m.id ? { ...x, ...updates } : x) });
      addLog("admin", "Admin", `Maintenance ${next}`, `${m.id} status: ${m.status} → ${next} on ${m.computerId}`);
    } catch {
      // Fallback
    }
  }

  async function cancelMaintenance(m: Maintenance) {
    try {
      await api.updateMaintenance(m.id, { status: "Cancelled" }).catch(() => null);
      setData({ ...data, maintenance: data.maintenance.map(x => x.id === m.id ? { ...x, status: "Cancelled" } : x) });
      addLog("admin", "Admin", "Maintenance Cancelled", `Cancelled ${m.id} on ${m.computerId}`);
    } catch {
      // Fallback
    }
  }

  const f = "w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#0ea5e9] transition-colors";
  const lbl = "block text-xs font-medium text-[#64748b] mb-1.5";

  const scheduled = data.maintenance.filter(m => m.status === "Scheduled").length;
  const inProgress = data.maintenance.filter(m => m.status === "In Progress").length;
  const completed = data.maintenance.filter(m => m.status === "Completed").length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            <span className="text-sky-400">{scheduled} scheduled</span>
            <span className="text-[#334155] mx-2">·</span>
            <span className="text-amber-400">{inProgress} in progress</span>
            <span className="text-[#334155] mx-2">·</span>
            <span className="text-emerald-400">{completed} completed</span>
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
          + Schedule Maintenance
        </button>
      </div>

      {/* Workflow legend */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-[#1e293b] border border-[#334155] rounded-lg flex-wrap">
        <span className="text-[10px] text-[#475569] mr-1">Workflow:</span>
        {(["Scheduled", "In Progress", "Completed"] as MaintenanceStatus[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <StatusBadge label={s} variant={getMaintenanceStatusVariant(s)} />
            {i < 2 && <span className="text-[#334155] text-xs">→</span>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#0ea5e9] transition-colors">
          <option>All</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterComputer} onChange={e => setFilterComputer(e.target.value)} className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#0ea5e9] transition-colors">
          <option>All</option>
          {data.computers.map(c => <option key={c.id}>{c.id}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">ID</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Computer</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Type &amp; Activity</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Technician</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Scheduled</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Status</th>
              <th className="px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {sorted.map(m => {
              const computer = data.computers.find(c => c.id === m.computerId);
              const nextStatus = MAINTENANCE_STATUS_FLOW[m.status];
              return (
                <tr key={m.id} className="hover:bg-[#0f172a] transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[#475569] text-xs">{m.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-[#0ea5e9] text-xs">{m.computerId}</div>
                    {computer && <div className="text-[10px] text-[#475569] mt-0.5">{computer.location}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs text-[#64748b] mb-0.5">{m.maintenanceType}</div>
                    <div className="text-sm text-white max-w-52 truncate" title={m.activity}>{m.activity}</div>
                    {m.notes && <div className="text-[10px] text-[#475569] mt-0.5 italic truncate max-w-52">{m.notes}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-[#94a3b8] text-xs">{m.technician}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-mono text-[#64748b]">{m.scheduledDate}</div>
                    {m.completedDate && <div className="text-[10px] text-emerald-500 mt-0.5">Done: {m.completedDate}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={m.status} variant={getMaintenanceStatusVariant(m.status)} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1.5 items-end">
                      {nextStatus && (
                        <button
                          onClick={() => advanceStatus(m)}
                          className="text-xs px-2.5 py-1 bg-[#0f172a] border border-[#0ea5e9] text-[#0ea5e9] rounded hover:bg-[#0ea5e9] hover:text-[#0f172a] transition-colors whitespace-nowrap"
                        >
                          → {nextStatus}
                        </button>
                      )}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(m)} className="text-xs text-[#64748b] hover:text-[#0ea5e9] transition-colors px-1.5 py-0.5">Edit</button>
                        {m.status !== "Cancelled" && m.status !== "Completed" && (
                          <button onClick={() => cancelMaintenance(m)} className="text-xs text-[#64748b] hover:text-amber-400 transition-colors px-1.5 py-0.5">Cancel</button>
                        )}
                        <button onClick={() => setDeleteConfirm(m.id)} className="text-xs text-[#64748b] hover:text-red-400 transition-colors px-1.5 py-0.5">Del</button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[#475569] text-sm">No maintenance records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? `Edit ${editing.id}` : "Schedule Maintenance"} onClose={() => setShowModal(false)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className={lbl}>Computer</label>
              <select className={f} value={form.computerId} onChange={e => setForm({ ...form, computerId: e.target.value })}>
                {data.computers.map(c => <option key={c.id} value={c.id}>{c.id} — {c.location}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Maintenance Type</label>
                <select className={f} value={form.maintenanceType} onChange={e => setForm({ ...form, maintenanceType: e.target.value })}>
                  {MAINTENANCE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={f} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as MaintenanceStatus })}>
                  {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Activity Description</label>
              <input className={f} value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} placeholder="e.g. Full system dust removal and thermal paste replacement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Assigned Technician</label>
                <input className={f} value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} placeholder="Engr. Name" />
              </div>
              <div>
                <label className={lbl}>Scheduled Date</label>
                <input type="date" className={f} value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={lbl}>Notes (optional)</label>
              <textarea className={`${f} resize-none h-20`} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes or instructions…" />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving to Database..." : editing ? "Save Changes" : "Schedule Maintenance"}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="Delete Maintenance Record" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-[#94a3b8]">
            Delete <span className="font-mono text-white">{deleteConfirm}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6">
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-400 transition-colors">
              Delete
            </button>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

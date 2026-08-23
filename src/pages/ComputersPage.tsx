import { useState } from "react";
import { generateId, todayDate } from "../data";
import type { AppData, Computer, ComputerStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getComputerStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
}

const STATUSES: ComputerStatus[] = ["Active", "Needs Maintenance", "Under Repair", "Decommissioned"];
const OS_OPTIONS = [
  "Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", "Windows 10 Home",
  "Ubuntu 22.04 LTS", "Ubuntu 20.04 LTS", "Fedora 40", "macOS Sonoma", "macOS Ventura", "Chrome OS",
];
const CPU_OPTIONS = [
  "Intel Core i3-10100", "Intel Core i3-12100", "Intel Core i5-11400", "Intel Core i5-12400",
  "Intel Core i7-12700", "AMD Ryzen 3 5300G", "AMD Ryzen 5 5600", "AMD Ryzen 5 5600G",
  "AMD Ryzen 7 5700G", "Apple M1", "Apple M2", "Apple M3", "Other",
];
const RAM_OPTIONS = ["4 GB DDR3", "8 GB DDR3", "8 GB DDR4", "16 GB DDR4", "32 GB DDR4", "16 GB Unified", "Other"];
const STORAGE_OPTIONS = ["128 GB HDD", "256 GB HDD", "500 GB HDD", "1 TB HDD", "128 GB SSD", "256 GB SSD", "512 GB SSD", "1 TB SSD", "Other"];

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

export default function ComputersPage({ data, setData, addLog }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Computer | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = data.computers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(c: Computer) {
    setEditing(c);
    setForm({ name: c.name, location: c.location, cpu: c.cpu, ram: c.ram, storage: c.storage, gpu: c.gpu, os: c.os, status: c.status, dateAcquired: c.dateAcquired });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.location.trim()) return;
    if (editing) {
      setData({ ...data, computers: data.computers.map(c => c.id === editing.id ? { ...c, ...form } : c) });
      addLog("admin", "Admin", "Computer Updated", `Updated ${editing.id} — ${form.location}`);
    } else {
      const id = form.name.trim() || generateId("PC", data.computers);
      const newComputer: Computer = { id, ...form, name: form.name.trim() };
      setData({ ...data, computers: [...data.computers, newComputer] });
      addLog("admin", "Admin", "Computer Added", `Added ${id} at ${form.location}`);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    setData({ ...data, computers: data.computers.filter(c => c.id !== id) });
    addLog("admin", "Admin", "Computer Deleted", `Deleted computer ${id}`);
    setDeleteConfirm(null);
  }

  const f = "w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#0ea5e9] transition-colors";
  const lbl = "block text-xs font-medium text-[#64748b] mb-1.5";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Computer Inventory</h1>
          <p className="text-sm text-[#64748b] mt-0.5">{data.computers.length} computers registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
          + Add Computer
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by ID, name, or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#0ea5e9] transition-colors"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#0ea5e9] transition-colors">
          <option>All</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold w-8" />
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Computer ID</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Location</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">CPU</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">RAM</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Storage</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">OS</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[#475569] font-semibold">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filtered.map(c => (
              <>
                <tr
                  key={c.id}
                  className="hover:bg-[#0f172a] transition-colors group cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <td className="px-4 py-3.5 text-[#475569] text-xs text-center">
                    <span className={`transition-transform inline-block ${expandedId === c.id ? "rotate-90" : ""}`}>›</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[#0ea5e9] text-xs">{c.id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#94a3b8] text-xs">{c.location}</td>
                  <td className="px-5 py-3.5 text-[#64748b] text-xs">{c.cpu}</td>
                  <td className="px-5 py-3.5 text-[#64748b] text-xs">{c.ram}</td>
                  <td className="px-5 py-3.5 text-[#64748b] text-xs">{c.storage}</td>
                  <td className="px-5 py-3.5 text-[#64748b] text-xs">{c.os}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={c.status} variant={getComputerStatusVariant(c.status)} />
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(c)} className="text-xs text-[#64748b] hover:text-[#0ea5e9] transition-colors px-2 py-1">Edit</button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="text-xs text-[#64748b] hover:text-red-400 transition-colors px-2 py-1">Delete</button>
                    </div>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-expanded`} className="bg-[#0f172a]">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="grid grid-cols-6 gap-4 text-xs">
                        <div>
                          <div className="text-[10px] text-[#475569] mb-1">Computer Name</div>
                          <div className="text-[#94a3b8]">{c.name}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#475569] mb-1">GPU</div>
                          <div className="text-[#94a3b8]">{c.gpu}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#475569] mb-1">Date Acquired</div>
                          <div className="font-mono text-[#64748b]">{c.dateAcquired}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#475569] mb-1">Open Problems</div>
                          <div className={`font-bold ${data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress")).length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {data.problems.filter(p => p.computerId === c.id && (p.status === "Open" || p.status === "In Progress")).length}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#475569] mb-1">Maintenance Jobs</div>
                          <div className="text-[#64748b]">{data.maintenance.filter(m => m.computerId === c.id).length} total</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-[#475569] text-sm">No computers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? `Edit ${editing.id}` : "Add Computer"} onClose={() => setShowModal(false)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Computer ID / Name *</label>
                <input className={f} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="PC-LAB-A-09" />
              </div>
              <div>
                <label className={lbl}>Location *</label>
                <input className={f} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lab A — Row 1, Seat 1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>CPU</label>
                <select className={f} value={form.cpu} onChange={e => setForm({ ...form, cpu: e.target.value })}>
                  {CPU_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>GPU</label>
                <input className={f} value={form.gpu} onChange={e => setForm({ ...form, gpu: e.target.value })} placeholder="Intel UHD 730" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>RAM</label>
                <select className={f} value={form.ram} onChange={e => setForm({ ...form, ram: e.target.value })}>
                  {RAM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Storage</label>
                <select className={f} value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })}>
                  {STORAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Operating System</label>
                <select className={f} value={form.os} onChange={e => setForm({ ...form, os: e.target.value })}>
                  {OS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={f} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ComputerStatus })}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Date Acquired</label>
              <input type="date" className={f} value={form.dateAcquired} onChange={e => setForm({ ...form, dateAcquired: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} className="flex-1 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
                {editing ? "Save Changes" : "Add Computer"}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Computer" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-[#94a3b8] mb-5">Delete <span className="font-mono text-white">{deleteConfirm}</span>? All associated problems and maintenance records will remain but be orphaned.</p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-400 transition-colors">Delete</button>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { useState } from "react";
import { PROBLEM_STATUS_FLOW, generateId, todayDate } from "../data";
import type { AppData, Problem, ProblemStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getProblemStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  role: UserRole;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
}

const ALL_STATUSES: ProblemStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

const STATUS_LABELS: Record<ProblemStatus, string> = {
  "Open": "Reported, awaiting admin review",
  "In Progress": "Admin is working on this issue",
  "Resolved": "Issue has been fixed",
  "Closed": "Verified and closed",
};

export default function ProblemsPage({ data, setData, role, addLog }: Props) {
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterComputer, setFilterComputer] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Problem | null>(null);
  const [form, setForm] = useState({ computerId: data.computers[0]?.id || "", description: "", reportedBy: "", status: "Open" as ProblemStatus });

  const filtered = data.problems.filter(p => {
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    const matchComputer = filterComputer === "All" || p.computerId === filterComputer;
    return matchStatus && matchComputer;
  });

  const sorted = [...filtered].sort((a, b) => b.dateReported.localeCompare(a.dateReported));

  function openAdd() {
    setEditing(null);
    setForm({ computerId: data.computers[0]?.id || "", description: "", reportedBy: "", status: "Open" });
    setShowModal(true);
  }

  function openEdit(p: Problem) {
    setEditing(p);
    setForm({ computerId: p.computerId, description: p.description, reportedBy: p.reportedBy, status: p.status });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.description.trim() || !form.reportedBy.trim()) return;
    if (editing) {
      setData({ ...data, problems: data.problems.map(p => p.id === editing.id ? { ...p, ...form } : p) });
      addLog("admin", "Admin", "Problem Updated", `Updated ${editing.id} on ${editing.computerId}`);
    } else {
      const id = generateId("PRB", data.problems);
      const newP: Problem = { id, ...form, status: "Open", dateReported: todayDate() };
      setData({ ...data, problems: [newP, ...data.problems] });
      addLog(role, role === "admin" ? "Admin" : form.reportedBy, "Problem Reported", `Reported ${id} on ${form.computerId}: ${form.description.slice(0, 60)}`);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    setData({ ...data, problems: data.problems.filter(p => p.id !== id) });
    addLog("admin", "Admin", "Problem Deleted", `Deleted problem ${id}`);
  }

  function advanceStatus(p: Problem) {
    const next = PROBLEM_STATUS_FLOW[p.status];
    if (!next) return;
    setData({ ...data, problems: data.problems.map(x => x.id === p.id ? { ...x, status: next } : x) });
    addLog("admin", "Admin", "Problem Status Updated", `${p.id} status: ${p.status} → ${next}`);
  }

  const f = "w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:border-[#0ea5e9] transition-colors";
  const lbl = "block text-xs font-medium text-[#64748b] mb-1.5";

  const openCount = data.problems.filter(p => p.status === "Open").length;
  const inProgressCount = data.problems.filter(p => p.status === "In Progress").length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{role === "staff" ? "Problem Reports" : "Problems"}</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            <span className="text-red-400">{openCount} open</span>
            <span className="text-[#334155] mx-2">·</span>
            <span className="text-amber-400">{inProgressCount} in progress</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === "staff" && (
            <span className="text-xs text-[#475569] bg-[#1e293b] border border-[#334155] px-3 py-1.5 rounded-lg">
              View only — use "Report Problem" to submit
            </span>
          )}
          {role === "admin" && (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
              + Add Problem
            </button>
          )}
        </div>
      </div>

      {/* Status workflow legend */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-[#1e293b] border border-[#334155] rounded-lg flex-wrap">
        <span className="text-[10px] text-[#475569] mr-1">Workflow:</span>
        {ALL_STATUSES.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <StatusBadge label={s} variant={getProblemStatusVariant(s)} />
            {i < ALL_STATUSES.length - 1 && <span className="text-[#334155] text-xs">→</span>}
          </div>
        ))}
        {role === "admin" && <span className="text-[10px] text-[#475569] ml-2">— Admin controls status transitions</span>}
        {role === "staff" && <span className="text-[10px] text-[#475569] ml-2">— Admin handles status updates</span>}
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

      {/* Cards */}
      <div className="space-y-3">
        {sorted.map(p => {
          const computer = data.computers.find(c => c.id === p.computerId);
          const nextStatus = PROBLEM_STATUS_FLOW[p.status];
          return (
            <div key={p.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-[#475569] transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-xs text-[#475569]">{p.id}</span>
                    <span className="font-mono text-xs text-[#0ea5e9]">{p.computerId}</span>
                    {computer && <span className="text-xs text-[#475569]">{computer.location}</span>}
                    <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                  </div>
                  <p className="text-sm text-[#f1f5f9] leading-relaxed mb-2">{p.description}</p>
                  <div className="text-[11px] text-[#475569]">
                    <span className="text-[#334155] italic">{STATUS_LABELS[p.status]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#475569] mt-1">
                    <span>Reported by <span className="text-[#64748b]">{p.reportedBy}</span></span>
                    <span className="font-mono">{p.dateReported}</span>
                  </div>
                </div>
                {role === "admin" && (
                  <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                    {nextStatus && (
                      <button
                        onClick={() => advanceStatus(p)}
                        className="text-xs px-3 py-1.5 bg-[#0f172a] border border-[#0ea5e9] text-[#0ea5e9] rounded-lg hover:bg-[#0ea5e9] hover:text-[#0f172a] transition-colors font-medium whitespace-nowrap"
                      >
                        → {nextStatus}
                      </button>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="text-xs text-[#64748b] hover:text-[#0ea5e9] transition-colors px-2 py-1">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-[#64748b] hover:text-red-400 transition-colors px-2 py-1">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-16 text-[#475569] text-sm">No problems matching current filters</div>
        )}
      </div>

      {showModal && role === "admin" && (
        <Modal title={editing ? `Edit ${editing.id}` : "Add Problem Record"} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={lbl}>Computer</label>
              <select className={f} value={form.computerId} onChange={e => setForm({ ...form, computerId: e.target.value })}>
                {data.computers.map(c => <option key={c.id} value={c.id}>{c.id} — {c.location}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea className={`${f} resize-none h-24`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Reported By</label>
                <input className={f} value={form.reportedBy} onChange={e => setForm({ ...form, reportedBy: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={f} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProblemStatus })}>
                  {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} className="flex-1 py-2 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
                {editing ? "Save Changes" : "Add Problem"}
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

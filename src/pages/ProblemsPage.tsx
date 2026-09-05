import { useState } from "react";
import { PROBLEM_STATUS_FLOW, generateId, todayDate } from "../data";
import type { AppData, Problem, ProblemStatus } from "../data";
import type { UserRole } from "../App";
import StatusBadge, { getProblemStatusVariant } from "../components/StatusBadge";
import Modal from "../components/Modal";
import { AppIcon } from "../components/Icons";
import { api } from "../api";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  role: UserRole;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
}

const ALL_STATUSES: ProblemStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

const STATUS_DESCRIPTIONS: Record<ProblemStatus, string> = {
  "Open": "Newly filed issue awaiting technician review",
  "In Progress": "Hardware/software diagnosis actively underway",
  "Resolved": "Repair completed; awaiting verification",
  "Closed": "Issue verified resolved and archived",
};

export default function ProblemsPage({ data, setData, role, addLog }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterComputer, setFilterComputer] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editing, setEditing] = useState<Problem | null>(null);
  const [form, setForm] = useState({
    computerId: data.computers[0]?.id || "",
    description: "",
    reportedBy: "",
    status: "Open" as ProblemStatus,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counts for pipeline tabs
  const openCount = data.problems.filter(p => p.status === "Open").length;
  const inProgressCount = data.problems.filter(p => p.status === "In Progress").length;
  const resolvedCount = data.problems.filter(p => p.status === "Resolved").length;
  const closedCount = data.problems.filter(p => p.status === "Closed").length;

  const filtered = data.problems.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.description.toLowerCase().includes(q) ||
      p.computerId.toLowerCase().includes(q) ||
      p.reportedBy.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    const matchComputer = filterComputer === "All" || p.computerId === filterComputer;
    return matchSearch && matchStatus && matchComputer;
  });

  const sorted = [...filtered].sort((a, b) => b.dateReported.localeCompare(a.dateReported));

  function openAdd() {
    setEditing(null);
    setForm({
      computerId: data.computers[0]?.id || "",
      description: "",
      reportedBy: role === "admin" ? "Admin" : "",
      status: "Open",
    });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p: Problem) {
    setEditing(p);
    setForm({
      computerId: p.computerId,
      description: p.description,
      reportedBy: p.reportedBy,
      status: p.status,
    });
    setFormError("");
    setShowModal(true);
  }

  async function syncComputerStatus(
    computerId: string,
    newProblemsList: Problem[],
    currentComputers: typeof data.computers
  ) {
    const comp = currentComputers.find(c => c.id === computerId);
    if (!comp || comp.status === "Decommissioned") return currentComputers;

    const hasActiveProblems = newProblemsList.some(
      p => p.computerId === computerId && (p.status === "Open" || p.status === "In Progress")
    );
    const hasActiveMaintenance = data.maintenance.some(
      m => m.computerId === computerId && (m.status === "Scheduled" || m.status === "In Progress")
    );

    let newStatus: typeof comp.status | null = null;
    if (!hasActiveProblems && !hasActiveMaintenance && (comp.status === "Needs Maintenance" || comp.status === "Under Repair")) {
      newStatus = "Active";
    } else if (hasActiveProblems && comp.status === "Active") {
      newStatus = "Needs Maintenance";
    }

    if (newStatus && newStatus !== comp.status) {
      await api.updateComputer(computerId, { status: newStatus }).catch(() => null);
      addLog("admin", "Admin", "Computer Status Updated", `${computerId} status synchronized to ${newStatus}`);
      return currentComputers.map(c => c.id === computerId ? { ...c, status: newStatus! } : c);
    }
    return currentComputers;
  }

  async function handleSave() {
    setFormError("");
    if (!form.computerId) {
      setFormError("Please select an affected workstation.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Problem description is required.");
      return;
    }
    if (!form.reportedBy.trim()) {
      setFormError("Reporter name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await api.updateProblem(editing.id, form).catch(() => ({ ...editing, ...form }));
        const updatedProblems = data.problems.map(p => p.id === editing.id ? { ...p, ...updated } : p);
        const updatedComputers = await syncComputerStatus(form.computerId, updatedProblems, data.computers);
        setData({ ...data, problems: updatedProblems, computers: updatedComputers });
        addLog("admin", "Admin", "Problem Updated", `Updated ${editing.id} on ${editing.computerId} (Status: ${form.status})`);
      } else {
        const id = generateId("PRB", data.problems);
        const newP: Problem = { id, ...form, status: "Open", dateReported: todayDate() };
        const saved = await api.createProblem(newP).catch(() => newP);
        const updatedProblems = [saved, ...data.problems];
        const updatedComputers = await syncComputerStatus(form.computerId, updatedProblems, data.computers);
        setData({ ...data, problems: updatedProblems, computers: updatedComputers });
        addLog(role, role === "admin" ? "Admin" : form.reportedBy, "Problem Reported", `Reported ${id} on ${form.computerId}: ${form.description.slice(0, 60)}`);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save problem report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteProblem(id).catch(() => null);
      const targetProblem = data.problems.find(p => p.id === id);
      const remainingProblems = data.problems.filter(p => p.id !== id);
      const updatedComputers = targetProblem
        ? await syncComputerStatus(targetProblem.computerId, remainingProblems, data.computers)
        : data.computers;
      setData({ ...data, problems: remainingProblems, computers: updatedComputers });
      addLog("admin", "Admin", "Problem Deleted", `Deleted problem ${id}`);
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function advanceStatus(p: Problem) {
    const next = PROBLEM_STATUS_FLOW[p.status];
    if (!next) return;
    try {
      await api.updateProblem(p.id, { status: next }).catch(() => null);
      const updatedProblems = data.problems.map(x => x.id === p.id ? { ...x, status: next } : x);
      const updatedComputers = await syncComputerStatus(p.computerId, updatedProblems, data.computers);
      setData({ ...data, problems: updatedProblems, computers: updatedComputers });
      addLog("admin", "Admin", "Problem Status Updated", `${p.id} status: ${p.status} → ${next}`);
    } catch {
      // Fallback
    }
  }

  const f = "w-full bg-[#131d33] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748b] focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all";
  const lbl = "block text-xs font-semibold text-[#94a3b8] mb-1.5";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {role === "staff" ? "Problem Reports" : "Problem & Incident Management"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {openCount} Open Tickets
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Track reported laboratory hardware anomalies, display faults, and maintenance requests
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === "staff" ? (
            <span className="text-xs text-[#64748b] bg-[#0f172a] border border-[#1e293b] px-3.5 py-2 rounded-xl">
              Staff View · Use "Report Problem" to file an issue
            </span>
          ) : (
            <button
              type="button"
              onClick={openAdd}
              className="btn-destructive"
            >
              <AppIcon name="plus" size={13} />
              <span>Log New Problem</span>
            </button>
          )}
        </div>
      </div>

      {/* Pipeline Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "All", label: "All Tickets", count: data.problems.length, color: "text-white" },
          { id: "Open", label: "Open", count: openCount, color: "text-rose-400" },
          { id: "In Progress", label: "In Progress", count: inProgressCount, color: "text-amber-400" },
          { id: "Resolved", label: "Resolved", count: resolvedCount, color: "text-emerald-400" },
          { id: "Closed", label: "Closed", count: closedCount, color: "text-slate-400" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
              filterStatus === tab.id
                ? "bg-[#0ea5e9] text-[#0b1329] shadow-md shadow-[#0ea5e9]/25"
                : "bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-white hover:border-[#334155]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                filterStatus === tab.id ? "bg-[#0b1329]/20 text-[#0b1329]" : "bg-[#131d33] text-[#64748b]"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search problems, computer ID, or reporter…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#131d33] border border-[#334155] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#64748b] focus:border-[#0ea5e9] transition-colors"
          />
          <span className="absolute left-3 top-2.5 text-[#64748b] pointer-events-none flex items-center">
            <AppIcon name="search" size={13} />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-[#64748b] hover:text-white flex items-center"
            >
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-[#94a3b8]">Computer:</span>
          <select
            value={filterComputer}
            onChange={e => setFilterComputer(e.target.value)}
            className="bg-[#131d33] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#0ea5e9] transition-colors"
          >
            <option value="All">All Workstations</option>
            {data.computers.map(c => <option key={c.id} value={c.id}>{c.id} ({c.location})</option>)}
          </select>
        </div>
      </div>

      {/* Problem Cards List */}
      <div className="space-y-4">
        {sorted.map(p => {
          const computer = data.computers.find(c => c.id === p.computerId);
          const nextStatus = PROBLEM_STATUS_FLOW[p.status];
          const isResolved = p.status === "Resolved" || p.status === "Closed";

          return (
            <div
              key={p.id}
              className="bg-[#0f172a] border border-[#1e293b] hover:border-[#334155] rounded-xl p-5 transition-all space-y-4 shadow-sm group"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-black text-[#38bdf8] bg-[#0284c7]/10 px-2.5 py-1 rounded-lg border border-[#0284c7]/20">
                    {p.computerId}
                  </span>
                  <span className="font-mono text-xs text-[#64748b]">{p.id}</span>
                  {computer && (
                    <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                      <AppIcon name="location" size={11} className="text-[#64748b]" />
                      <span>{computer.location}</span>
                    </span>
                  )}
                  <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                </div>

                <div className="text-[11px] text-[#64748b] flex items-center gap-2">
                  <span>Reported on: <strong className="text-[#94a3b8] font-mono">{p.dateReported}</strong></span>
                  <span>·</span>
                  <span>by <strong className="text-white">{p.reportedBy}</strong></span>
                </div>
              </div>

              {/* Description Body */}
              <div className="bg-[#131d33] border border-[#1e293b] rounded-xl p-4">
                <p className="text-sm text-white leading-relaxed">{p.description}</p>
                <div className="text-[11px] text-[#64748b] mt-2 italic flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-[#38bdf8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
                  </svg>
                  <span>{STATUS_DESCRIPTIONS[p.status]}</span>
                </div>
              </div>

              {/* Visual Workflow Steps Bar */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-[#64748b] mr-2">Lifecycle:</span>
                {ALL_STATUSES.map((st, i) => {
                  const isCurrent = p.status === st;
                  const isPassed = ALL_STATUSES.indexOf(p.status) > i;

                  return (
                    <div key={st} className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                          isCurrent
                            ? "bg-[#0ea5e9]/20 text-[#38bdf8] border border-[#0ea5e9]/40"
                            : isPassed
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-[#475569] bg-[#1e293b]/40"
                        }`}
                      >
                        {isPassed && <AppIcon name="check" size={10} className="text-emerald-400" />}
                        <span>{st}</span>
                      </span>
                      {i < ALL_STATUSES.length - 1 && <span className="text-[#334155] text-xs">→</span>}
                    </div>
                  );
                })}
              </div>

              {/* Action Controls */}
              {role === "admin" && (
                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => advanceStatus(p)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                          nextStatus === "Resolved"
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                            : nextStatus === "In Progress"
                            ? "bg-amber-500 hover:bg-amber-600 text-[#0b1329] shadow-amber-500/20"
                            : "bg-[#0ea5e9] hover:bg-[#38bdf8] text-[#0b1329] shadow-sky-500/20"
                        }`}
                      >
                        <span>→ Advance to {nextStatus}</span>
                      </button>
                    )}
                    {isResolved && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <AppIcon name="check" size={12} />
                        <span>Resolved in system</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="px-3 py-1.5 rounded-lg border border-[#334155] text-xs font-semibold text-[#94a3b8] hover:text-white hover:border-[#0ea5e9] transition-colors"
                    >
                      Edit Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(p.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#334155] text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-16 bg-[#0f172a] border border-[#1e293b] rounded-xl text-sm text-[#64748b]">
            <AppIcon name="check" size={32} className="mx-auto mb-2 text-emerald-400" />
            <div className="text-base font-bold text-white mb-1">No problem reports found</div>
            <p className="text-xs text-[#64748b] max-w-sm mx-auto mb-4">
              All workstations in this selection are operational with no issues logged.
            </p>
            {(filterStatus !== "All" || filterComputer !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => { setFilterStatus("All"); setFilterComputer("All"); setSearchQuery(""); }}
                className="btn-secondary"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Problem Modal */}
      {showModal && role === "admin" && (
        <Modal
          title={editing ? `Edit Ticket ${editing.id}` : "Log Problem Incident"}
          subtitle="Document issue details, hardware malfunction, and reporter"
          maxWidth="max-w-xl"
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {formError}
              </div>
            )}

            <div>
              <label className={lbl}>Affected Workstation *</label>
              {data.computers.length === 0 ? (
                <div className="text-xs text-rose-400 p-2.5 bg-rose-500/10 rounded-xl">
                  No computers registered in inventory.
                </div>
              ) : (
                <select
                  className={f}
                  value={form.computerId}
                  onChange={e => setForm({ ...form, computerId: e.target.value })}
                >
                  {data.computers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.location}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={lbl}>Problem / Incident Description *</label>
              <textarea
                className={`${f} resize-none h-24`}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the symptoms, error messages, and observed behavior in detail…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Reported By *</label>
                <input
                  className={f}
                  value={form.reportedBy}
                  onChange={e => setForm({ ...form, reportedBy: e.target.value })}
                  placeholder="e.g. Maria Santos / Engr. Lim"
                />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select
                  className={f}
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as ProblemStatus })}
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-bold rounded-xl hover:from-rose-700 hover:to-rose-600 disabled:opacity-50 transition-all shadow-md shadow-rose-600/25"
              >
                {isSubmitting ? "Saving Ticket..." : editing ? "Save Changes" : "Create Problem Ticket"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-[#334155] text-[#94a3b8] text-xs font-semibold rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Ticket Confirmation */}
      {deleteConfirm && (
        <Modal title="Delete Incident Ticket" onClose={() => setDeleteConfirm(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[#94a3b8] leading-relaxed">
              Are you sure you want to permanently delete problem record{" "}
              <span className="font-mono text-white font-bold">{deleteConfirm}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
              >
                Delete Ticket
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-[#334155] text-[#94a3b8] text-xs font-semibold rounded-xl hover:text-white transition-colors"
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

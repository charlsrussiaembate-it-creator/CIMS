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
      setFormError("Select a computer.");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Provide a detailed description of the problem.");
      return;
    }
    if (!form.reportedBy.trim()) {
      setFormError("Enter the name of the person reporting this issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload: Problem = {
          ...editing,
          computerId: form.computerId,
          description: form.description.trim(),
          reportedBy: form.reportedBy.trim(),
          status: form.status,
        };
        const updated = await api.updateProblem(editing.id, payload).catch(() => payload);
        const nextProblems = data.problems.map(p => p.id === editing.id ? updated : p);
        const nextComputers = await syncComputerStatus(form.computerId, nextProblems, data.computers);
        setData({ ...data, problems: nextProblems, computers: nextComputers });
        addLog("admin", "Admin", "Problem Updated", `Updated ${editing.id} on ${form.computerId} to "${form.status}"`);
      } else {
        const id = generateId("PRB", data.problems);
        const newProb: Problem = {
          id,
          computerId: form.computerId,
          description: form.description.trim(),
          reportedBy: form.reportedBy.trim(),
          status: form.status,
          dateReported: todayDate(),
        };
        const created = await api.createProblem(newProb).catch(() => newProb);
        const nextProblems = [created, ...data.problems];
        const nextComputers = await syncComputerStatus(form.computerId, nextProblems, data.computers);
        setData({ ...data, problems: nextProblems, computers: nextComputers });
        addLog(role, form.reportedBy.trim(), "Problem Reported", `Reported issue on ${form.computerId}: "${form.description.slice(0, 50)}..."`);
      }
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save problem ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function advanceStatus(p: Problem) {
    const nextStatus = PROBLEM_STATUS_FLOW[p.status];
    if (!nextStatus) return;

    try {
      const updated: Problem = { ...p, status: nextStatus };
      await api.updateProblem(p.id, updated).catch(() => null);
      const nextProblems = data.problems.map(item => item.id === p.id ? updated : item);
      const nextComputers = await syncComputerStatus(p.computerId, nextProblems, data.computers);
      setData({ ...data, problems: nextProblems, computers: nextComputers });
      addLog("admin", "Admin", "Problem Status Advanced", `Advanced ${p.id} on ${p.computerId} to "${nextStatus}"`);
    } catch {
      // Fallback
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteProblem(id).catch(() => null);
      const target = data.problems.find(p => p.id === id);
      const nextProblems = data.problems.filter(p => p.id !== id);
      const nextComputers = target
        ? await syncComputerStatus(target.computerId, nextProblems, data.computers)
        : data.computers;

      setData({ ...data, problems: nextProblems, computers: nextComputers });
      addLog("admin", "Admin", "Problem Deleted", `Deleted problem record ${id}`);
    } finally {
      setDeleteConfirm(null);
    }
  }

  const f = "w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#28166F] shadow-2xs transition-colors";
  const lbl = "block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider";

  return (
    <div className="p-5 sm:p-6 max-w-7xl mx-auto space-y-4 font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              {role === "staff" ? "Problem Reports" : "Problem & Incident Management"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
              {openCount} Open Tickets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track reported laboratory hardware anomalies, display faults, and maintenance requests
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role === "staff" ? (
            <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "All", label: "All Tickets", count: data.problems.length },
          { id: "Open", label: "Open", count: openCount },
          { id: "In Progress", label: "In Progress", count: inProgressCount },
          { id: "Resolved", label: "Resolved", count: resolvedCount },
          { id: "Closed", label: "Closed", count: closedCount },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
              filterStatus === tab.id
                ? "bg-[#28166F] text-white shadow-xs font-bold"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                filterStatus === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search problems, computer ID, or reporter…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#28166F] focus:bg-white transition-colors"
          />
          <span className="absolute left-3 top-2 text-slate-400 pointer-events-none flex items-center">
            <AppIcon name="search" size={13} />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-slate-400 hover:text-slate-700 flex items-center cursor-pointer"
            >
              <AppIcon name="close" size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto font-medium text-xs text-slate-600">
          <span>Workstation:</span>
          <select
            value={filterComputer}
            onChange={e => setFilterComputer(e.target.value)}
            className="bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:border-[#28166F] focus:bg-white transition-colors cursor-pointer"
          >
            <option value="All">All Workstations</option>
            {data.computers.map(c => <option key={c.id} value={c.id}>{c.id} ({c.location})</option>)}
          </select>
        </div>
      </div>

      {/* Problem Cards List */}
      <div className="space-y-3">
        {sorted.map(p => {
          const computer = data.computers.find(c => c.id === p.computerId);
          const nextStatus = PROBLEM_STATUS_FLOW[p.status];
          const isResolved = p.status === "Resolved" || p.status === "Closed";

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all space-y-3 shadow-xs group"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#28166F] bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                    {p.computerId}
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-medium">{p.id}</span>
                  {computer && (
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <AppIcon name="location" size={11} className="text-slate-500" />
                      <span>{computer.location}</span>
                    </span>
                  )}
                  <StatusBadge label={p.status} variant={getProblemStatusVariant(p.status)} />
                </div>

                <div className="text-[11px] text-slate-600 flex items-center gap-2 font-medium">
                  <span>Reported on: <strong className="text-slate-800 font-mono">{p.dateReported}</strong></span>
                  <span>·</span>
                  <span>by <strong className="text-slate-800 font-bold">{p.reportedBy}</strong></span>
                </div>
              </div>

              {/* Description Body */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5">
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">{p.description}</p>
                <div className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                  <AppIcon name="info" size={12} className="text-[#28166F] flex-shrink-0" />
                  <span>{STATUS_DESCRIPTIONS[p.status]}</span>
                </div>
              </div>

              {/* Visual Workflow Steps Bar */}
              <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Lifecycle:</span>
                {ALL_STATUSES.map((st, i) => {
                  const isCurrent = p.status === st;
                  const isPassed = ALL_STATUSES.indexOf(p.status) > i;

                  return (
                    <div key={st} className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isCurrent
                            ? "bg-[#28166F] text-white border border-[#28166F] shadow-2xs"
                            : isPassed
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            : "text-slate-500 bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {isPassed && <AppIcon name="check" size={10} className="text-emerald-600" />}
                        <span>{st}</span>
                      </span>
                      {i < ALL_STATUSES.length - 1 && <span className="text-slate-300 text-xs">→</span>}
                    </div>
                  );
                })}
              </div>

              {/* Action Controls */}
              {role === "admin" && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {nextStatus && (
                      <button
                        type="button"
                        onClick={() => advanceStatus(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                          nextStatus === "Resolved"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : nextStatus === "In Progress"
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-[#28166F] hover:bg-[#1e1058] text-white"
                        }`}
                      >
                        <span>→ Advance to {nextStatus}</span>
                      </button>
                    )}
                    {isResolved && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <AppIcon name="check" size={12} />
                        <span>Resolved in system</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Edit Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(p.id)}
                      className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
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
          <div className="text-center py-16 bg-white border border-slate-200 shadow-xs rounded-xl p-8">
            <AppIcon name="check" size={32} className="mx-auto mb-2 text-emerald-600" />
            <div className="text-base font-serif font-bold text-slate-900 mb-1">No problem reports found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-medium">
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className={lbl}>Affected Workstation *</label>
              {data.computers.length === 0 ? (
                <div className="text-xs text-rose-700 p-2.5 bg-rose-50 border border-rose-200 rounded-xl font-medium">
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

            <div className="grid grid-cols-2 gap-3.5">
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

            <div className="flex gap-3 pt-3.5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="btn-destructive flex-1 py-2.5"
              >
                {isSubmitting ? "Saving Ticket..." : editing ? "Save Changes" : "Create Problem Ticket"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary px-5 py-2.5"
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
          <div className="space-y-4 text-slate-800">
            <p className="text-sm leading-relaxed">
              Are you sure you want to permanently delete problem record{" "}
              <span className="font-mono text-slate-900 font-bold">{deleteConfirm}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-destructive flex-1 py-2"
              >
                Delete Ticket
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary px-4 py-2"
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

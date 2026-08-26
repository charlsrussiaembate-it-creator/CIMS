import { useState } from "react";
import { generateId, nowTimestamp, todayDate } from "../data";
import type { AppData } from "../data";
import type { StaffPage, UserRole } from "../App";
import { api } from "../api";

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  setPage: (p: StaffPage) => void;
  addLog: (role: UserRole, actor: string, action: string, details: string) => void;
}

type Step = "form" | "success";

export default function StaffReportPage({ data, setData, setPage, addLog }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [submittedId, setSubmittedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    computerId: data.computers[0]?.id || "",
    description: "",
    reportedBy: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.computerId) e.computerId = "Please select a computer.";
    if (!form.description.trim()) e.description = "Please describe the problem.";
    if (!form.reportedBy.trim()) e.reportedBy = "Please enter your name.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    const id = generateId("PRB", data.problems);
    const newProblem = {
      id,
      computerId: form.computerId,
      description: form.description.trim(),
      dateReported: todayDate(),
      status: "Open" as const,
      reportedBy: form.reportedBy.trim(),
    };
    try {
      const saved = await api.createProblem(newProblem).catch(() => newProblem);
      setData({ ...data, problems: [saved, ...data.problems] });
      addLog("staff", form.reportedBy.trim(), "Problem Reported", `Reported ${id} on ${form.computerId}: ${form.description.slice(0, 60)}`);
      setSubmittedId(id);
      setStep("success");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setForm({ computerId: data.computers[0]?.id || "", description: "", reportedBy: "" });
    setErrors({});
    setStep("form");
  }

  const field = (hasError: boolean) =>
    `w-full bg-[#0f172a] border rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] transition-colors ${
      hasError ? "border-red-500 focus:border-red-400" : "border-[#334155] focus:border-[#0ea5e9]"
    }`;

  const computer = data.computers.find(c => c.id === form.computerId);

  if (step === "success") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Problem Reported</h1>
          <p className="text-[#64748b] text-sm mb-1">Your report has been submitted successfully.</p>
          <p className="text-sm text-[#94a3b8] mb-6">
            Report ID: <span className="font-mono text-[#0ea5e9]">{submittedId}</span>
          </p>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 text-left mb-6 max-w-md mx-auto">
            <div className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">Report Summary</div>
            <div className="space-y-2.5">
              <div className="flex gap-3">
                <span className="text-xs text-[#475569] w-24 flex-shrink-0">Computer</span>
                <span className="text-xs font-mono text-[#0ea5e9]">{form.computerId}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-[#475569] w-24 flex-shrink-0">Location</span>
                <span className="text-xs text-[#94a3b8]">{computer?.location}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-[#475569] w-24 flex-shrink-0">Reported by</span>
                <span className="text-xs text-[#94a3b8]">{form.reportedBy}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-[#475569] w-24 flex-shrink-0">Date/Time</span>
                <span className="text-xs font-mono text-[#94a3b8]">{nowTimestamp()}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-xs text-[#475569] w-24 flex-shrink-0">Status</span>
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Open</span>
              </div>
              <div className="pt-2 border-t border-[#334155]">
                <span className="text-xs text-[#475569] block mb-1.5">Description</span>
                <p className="text-xs text-[#94a3b8] leading-relaxed">{form.description}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#475569] mb-6">The admin team will review your report and update the status. You can track it under <strong className="text-[#64748b]">View Problems</strong>.</p>

          <div className="flex gap-3 justify-center">
            <button onClick={handleReset} className="px-5 py-2.5 bg-[#0ea5e9] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors">
              Report Another Problem
            </button>
            <button onClick={() => setPage("my-problems")} className="px-5 py-2.5 border border-[#334155] text-[#94a3b8] text-sm rounded-lg hover:text-white hover:border-[#475569] transition-colors">
              View All Problems
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => setPage("dashboard")} className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors mb-4 flex items-center gap-1">
          ← Back to Home
        </button>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded">Staff Action</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Report a Problem</h1>
        <p className="text-sm text-[#64748b] mt-1">Describe the issue you've encountered. The admin team will handle resolution.</p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <div className="space-y-5">
          {/* Computer selector */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Computer *</label>
            <select
              className={field(!!errors.computerId)}
              value={form.computerId}
              onChange={e => { setForm({ ...form, computerId: e.target.value }); setErrors({ ...errors, computerId: undefined }); }}
            >
              {data.computers
                .filter(c => c.status !== "Decommissioned")
                .map(c => (
                  <option key={c.id} value={c.id}>{c.id} — {c.location}</option>
                ))}
            </select>
            {errors.computerId && <p className="text-xs text-red-400 mt-1">{errors.computerId}</p>}
            {/* Computer info preview */}
            {computer && (
              <div className="mt-2 p-3 bg-[#0f172a] rounded-lg border border-[#1e293b] grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-[#475569]">OS</div>
                  <div className="text-xs text-[#64748b]">{computer.os}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#475569]">CPU</div>
                  <div className="text-xs text-[#64748b]">{computer.cpu}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#475569]">Status</div>
                  <div className={`text-xs font-medium ${
                    computer.status === "Active" ? "text-emerald-400" :
                    computer.status === "Under Repair" ? "text-orange-400" : "text-amber-400"
                  }`}>{computer.status}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Problem Description *</label>
            <textarea
              className={`${field(!!errors.description)} resize-none h-32`}
              value={form.description}
              onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }); }}
              placeholder="Describe what's wrong in detail — what happened, when it started, how it affects use…"
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            <p className="text-[11px] text-[#475569] mt-1">Be specific — it helps the technician diagnose the problem faster.</p>
          </div>

          {/* Reporter name */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Your Name *</label>
            <input
              className={field(!!errors.reportedBy)}
              value={form.reportedBy}
              onChange={e => { setForm({ ...form, reportedBy: e.target.value }); setErrors({ ...errors, reportedBy: undefined }); }}
              placeholder="Full name"
            />
            {errors.reportedBy && <p className="text-xs text-red-400 mt-1">{errors.reportedBy}</p>}
          </div>

          {/* Auto-recorded info */}
          <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e293b]">
            <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-2">Automatically Recorded</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[#334155]">Date &amp; Time</div>
                <div className="text-xs font-mono text-[#64748b]">{nowTimestamp()}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#334155]">Initial Status</div>
                <div className="text-xs font-mono text-red-400">Open</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#0ea5e9] text-[#0f172a] text-sm font-bold rounded-lg hover:bg-[#38bdf8] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Submitting Report to Database..." : "Submit Problem Report →"}
          </button>
        </div>
      </div>
    </div>
  );
}

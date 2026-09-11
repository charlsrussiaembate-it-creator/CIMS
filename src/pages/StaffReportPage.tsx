import { useState } from "react";
import { generateId, nowTimestamp, todayDate } from "../data";
import type { AppData } from "../data";
import type { StaffPage, UserRole } from "../App";
import { AppIcon } from "../components/Icons";
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
    `w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-2xs transition-colors ${
      hasError ? "border-rose-500 focus:border-rose-600" : "border-slate-200 focus:border-[#28166F]"
    }`;

  const computer = data.computers.find(c => c.id === form.computerId);

  if (step === "success") {
    return (
      <div className="p-5 sm:p-8 max-w-2xl mx-auto font-sans text-slate-900">
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-xs">
            <AppIcon name="check" size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 mb-1">Problem Reported</h1>
          <p className="text-slate-500 text-xs mb-1">Your report has been logged successfully into the laboratory system.</p>
          <p className="text-xs text-slate-600 mb-5 font-medium">
            Report Reference ID: <span className="font-mono font-bold text-[#28166F]">{submittedId}</span>
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-4 text-left mb-6 max-w-md mx-auto shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Report Summary</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Workstation</span>
                <span className="font-mono font-bold text-[#28166F]">{form.computerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="font-semibold text-slate-800">{computer?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Reported by</span>
                <span className="font-bold text-slate-800">{form.reportedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Date/Time</span>
                <span className="font-mono text-slate-600">{nowTimestamp()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Initial Status</span>
                <span className="font-mono text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200 font-bold">Open</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block mb-1 font-medium">Description</span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">{form.description}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-5 font-medium">The lab administrator will review this ticket and schedule resolution.</p>

          <div className="flex gap-2.5 justify-center">
            <button onClick={handleReset} className="btn-primary">
              Report Another Problem
            </button>
            <button onClick={() => setPage("my-problems")} className="btn-secondary">
              View My Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 max-w-2xl mx-auto space-y-4 font-sans text-slate-900">
      <div>
        <button
          type="button"
          onClick={() => setPage("dashboard")}
          className="text-xs font-semibold text-[#28166F] hover:underline mb-2.5 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Workspace
        </button>
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">Report a Problem</h1>
        <p className="text-xs text-slate-500 mt-0.5">Describe the hardware or system issue you encountered in the laboratory.</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-5">
        <div className="space-y-4">
          {/* Computer selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Workstation *</label>
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
            {errors.computerId && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.computerId}</p>}
            {/* Computer info preview */}
            {computer && (
              <div className="mt-2 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">OS</div>
                  <div className="font-semibold text-slate-700">{computer.os}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">CPU</div>
                  <div className="font-semibold text-slate-700 truncate">{computer.cpu}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Current Status</div>
                  <div className={`font-bold ${
                    computer.status === "Active" ? "text-emerald-700" :
                    computer.status === "Under Repair" ? "text-orange-700" : "text-amber-700"
                  }`}>{computer.status}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Problem Description *</label>
            <textarea
              className={`${field(!!errors.description)} resize-none h-28`}
              value={form.description}
              onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }); }}
              placeholder="Describe what's wrong in detail — what happened, when it started, how it affects lab use…"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.description}</p>}
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Be specific — this helps the technician service the computer faster.</p>
          </div>

          {/* Reporter name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Your Name *</label>
            <input
              className={field(!!errors.reportedBy)}
              value={form.reportedBy}
              onChange={e => { setForm({ ...form, reportedBy: e.target.value }); setErrors({ ...errors, reportedBy: undefined }); }}
              placeholder="Enter your full name or faculty ID"
            />
            {errors.reportedBy && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.reportedBy}</p>}
          </div>

          {/* Auto-recorded info */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">System Context</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] text-slate-500">Timestamp</div>
                <div className="font-mono font-medium text-slate-700">{nowTimestamp()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Initial Status</div>
                <div className="font-mono text-rose-700 font-bold">Open</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5"
          >
            {isSubmitting ? "Submitting Report to Database..." : "Submit Problem Report →"}
          </button>
        </div>
      </div>
    </div>
  );
}

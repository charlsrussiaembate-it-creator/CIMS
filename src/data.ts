export type ComputerStatus = "Active" | "Needs Maintenance" | "Under Repair" | "Decommissioned";
export type ProblemStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";

export interface Computer {
  id: string;
  name: string;
  location: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  os: string;
  status: ComputerStatus;
  dateAcquired: string;
}

export interface Problem {
  id: string;
  computerId: string;
  description: string;
  dateReported: string;
  status: ProblemStatus;
  reportedBy: string;
}

export interface Maintenance {
  id: string;
  computerId: string;
  maintenanceType: string;
  activity: string;
  technician: string;
  scheduledDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  role: "admin" | "staff";
  actor: string;
  action: string;
  details: string;
}

export interface AppData {
  computers: Computer[];
  problems: Problem[];
  maintenance: Maintenance[];
  auditLogs: AuditLog[];
}

export const PROBLEM_STATUS_FLOW: Record<ProblemStatus, ProblemStatus | null> = {
  "Open": "In Progress",
  "In Progress": "Resolved",
  "Resolved": "Closed",
  "Closed": null,
};

export const MAINTENANCE_STATUS_FLOW: Record<MaintenanceStatus, MaintenanceStatus | null> = {
  "Scheduled": "In Progress",
  "In Progress": "Completed",
  "Completed": null,
  "Cancelled": null,
};

export const MAINTENANCE_TYPES = [
  "Preventive Cleaning",
  "OS Reinstall",
  "Hardware Upgrade",
  "Software Update",
  "Network Configuration",
  "Virus/Malware Removal",
  "Component Replacement",
  "Data Backup",
  "Performance Optimization",
  "Other",
];

export interface CampusLocation {
  id: string;
  label: string;
  fullName: string;
  icon: string;
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { id: "ComLab", label: "ComLab", fullName: "College Computer Laboratory", icon: "comlab" },
  { id: "SHS Lab", label: "SHS Lab", fullName: "Senior High School Lab", icon: "shs" },
  { id: "Registrar", label: "Registrar", fullName: "Registrar's Office", icon: "registrar" },
  { id: "Laboratory", label: "Laboratory", fullName: "Science & Technology Laboratory", icon: "laboratory" },
];

export const initialData: AppData = {
  computers: [],
  problems: [],
  maintenance: [],
  auditLogs: [],
};

export function generateId(prefix: string, items: { id: string }[]): string {
  const nums = items
    .map(i => parseInt(i.id.split("-").pop() || "0"))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

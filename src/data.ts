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
  computers: [
    {
      id: "PC-COMLAB-01", name: "PC-COMLAB-01", location: "ComLab — Row 1, Seat 1",
      cpu: "Intel Core i7-13700", ram: "32 GB DDR5", storage: "1 TB NVMe SSD", gpu: "NVIDIA RTX 3060 12GB",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2024-09-01",
    },
    {
      id: "PC-COMLAB-02", name: "PC-COMLAB-02", location: "ComLab — Row 1, Seat 2",
      cpu: "Intel Core i7-13700", ram: "32 GB DDR5", storage: "1 TB NVMe SSD", gpu: "NVIDIA RTX 3060 12GB",
      os: "Windows 11 Pro", status: "Needs Maintenance", dateAcquired: "2024-09-01",
    },
    {
      id: "PC-SHS-01", name: "PC-SHS-01", location: "SHS Lab — Station 1",
      cpu: "Intel Core i5-12400", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2024-06-15",
    },
    {
      id: "PC-SHS-02", name: "PC-SHS-02", location: "SHS Lab — Station 2",
      cpu: "AMD Ryzen 5 5600G", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "AMD Radeon Graphics",
      os: "Windows 11 Pro", status: "Under Repair", dateAcquired: "2024-07-20",
    },
    {
      id: "PC-REG-01", name: "PC-REG-01", location: "Registrar — Enrollment Counter 1",
      cpu: "Intel Core i5-11400", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2023-11-10",
    },
    {
      id: "PC-REG-02", name: "PC-REG-02", location: "Registrar — Student Records Desk",
      cpu: "Intel Core i5-11400", ram: "16 GB DDR4", storage: "1 TB HDD + 256 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 10 Pro", status: "Active", dateAcquired: "2023-11-10",
    },
    {
      id: "PC-LAB-01", name: "PC-LAB-01", location: "Laboratory — Research Bench 1",
      cpu: "Intel Core i7-11700", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 750",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2023-08-14",
    },
    {
      id: "PC-LAB-02", name: "PC-LAB-02", location: "Laboratory — Digital Microscope Station",
      cpu: "Intel Core i5-10400", ram: "8 GB DDR4", storage: "256 GB SSD", gpu: "Intel UHD 630",
      os: "Ubuntu 22.04 LTS", status: "Active", dateAcquired: "2023-08-14",
    },
    {
      id: "PC-LAB-A-01", name: "PC-LAB-A-01", location: "Lab A — Row 1, Seat 1",
      cpu: "Intel Core i5-12400", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2024-06-15",
    },
    {
      id: "PC-LAB-A-02", name: "PC-LAB-A-02", location: "Lab A — Row 1, Seat 2",
      cpu: "Intel Core i5-12400", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 11 Pro", status: "Needs Maintenance", dateAcquired: "2024-06-15",
    },
    {
      id: "PC-LAB-A-03", name: "PC-LAB-A-03", location: "Lab A — Row 2, Seat 1",
      cpu: "Intel Core i5-12400", ram: "16 GB DDR4", storage: "512 GB SSD", gpu: "Intel UHD 730",
      os: "Windows 11 Pro", status: "Active", dateAcquired: "2024-06-15",
    },
    {
      id: "PC-LAB-A-04", name: "PC-LAB-A-04", location: "Lab A — Row 2, Seat 2",
      cpu: "AMD Ryzen 5 5600", ram: "8 GB DDR4", storage: "256 GB SSD", gpu: "AMD Radeon Vega 7",
      os: "Ubuntu 22.04 LTS", status: "Under Repair", dateAcquired: "2024-08-01",
    },
    {
      id: "PC-LAB-B-01", name: "PC-LAB-B-01", location: "Lab B — Row 1, Seat 1",
      cpu: "Intel Core i3-10100", ram: "8 GB DDR4", storage: "256 GB HDD", gpu: "Intel UHD 630",
      os: "Windows 10 Pro", status: "Active", dateAcquired: "2023-09-10",
    },
    {
      id: "PC-LAB-B-02", name: "PC-LAB-B-02", location: "Lab B — Row 1, Seat 2",
      cpu: "Intel Core i3-10100", ram: "8 GB DDR4", storage: "256 GB HDD", gpu: "Intel UHD 630",
      os: "Windows 10 Pro", status: "Active", dateAcquired: "2023-09-10",
    },
    {
      id: "PC-LAB-B-03", name: "PC-LAB-B-03", location: "Lab B — Row 2, Seat 1",
      cpu: "Intel Core i3-8100", ram: "4 GB DDR3", storage: "128 GB HDD", gpu: "Intel UHD 630",
      os: "Windows 10 Pro", status: "Decommissioned", dateAcquired: "2022-01-20",
    },
    {
      id: "PC-FACULTY-01", name: "PC-FACULTY-01", location: "Faculty Room",
      cpu: "Apple M2", ram: "16 GB Unified", storage: "512 GB SSD", gpu: "Apple M2 10-core GPU",
      os: "macOS Sonoma", status: "Active", dateAcquired: "2024-01-05",
    },
  ],
  problems: [
    {
      id: "PRB-001", computerId: "PC-LAB-A-02",
      description: "Screen flickers intermittently when display brightness is set above 70%. Affects visibility during classes.",
      dateReported: "2026-08-10", status: "In Progress", reportedBy: "Maria Santos",
    },
    {
      id: "PRB-002", computerId: "PC-LAB-A-04",
      description: "System fails to boot — POST error code 0x0000007B. Suspected hard drive failure. Computer is unusable.",
      dateReported: "2026-08-05", status: "Resolved", reportedBy: "Juan dela Cruz",
    },
    {
      id: "PRB-003", computerId: "PC-LAB-B-01",
      description: "Keyboard keys D and F are completely unresponsive. Affects typing tasks for students.",
      dateReported: "2026-08-18", status: "Open", reportedBy: "Ana Reyes",
    },
    {
      id: "PRB-004", computerId: "PC-LAB-A-03",
      description: "Very slow startup — taking over 3 minutes to reach the desktop. Delays class start time.",
      dateReported: "2026-07-28", status: "Closed", reportedBy: "Jose Bautista",
    },
    {
      id: "PRB-005", computerId: "PC-LAB-A-01",
      description: "Mouse cursor freezes randomly every 10–15 minutes. Requires unplugging and replugging the mouse to restore.",
      dateReported: "2026-08-20", status: "Open", reportedBy: "Rosa Mendoza",
    },
  ],
  maintenance: [
    {
      id: "MNT-001", computerId: "PC-LAB-A-01",
      maintenanceType: "Preventive Cleaning", activity: "Full system dust removal and thermal paste replacement",
      technician: "Engr. Roberto Lim", scheduledDate: "2026-08-15", completedDate: "2026-08-15",
      status: "Completed", notes: "CPU temps reduced from 85°C to 62°C under load after cleaning.",
    },
    {
      id: "MNT-002", computerId: "PC-LAB-A-03",
      maintenanceType: "OS Reinstall", activity: "Windows 11 clean install and full software setup",
      technician: "Engr. Roberto Lim", scheduledDate: "2026-07-30", completedDate: "2026-07-30",
      status: "Completed", notes: "Startup time reduced from 3+ minutes to under 30 seconds.",
    },
    {
      id: "MNT-003", computerId: "PC-LAB-A-04",
      maintenanceType: "Component Replacement", activity: "HDD replacement with 512 GB SSD — data recovery attempted",
      technician: "Engr. Carlo Reyes", scheduledDate: "2026-08-12", completedDate: "2026-08-14",
      status: "Completed", notes: "70% of files recovered. New SSD installed and OS configured.",
    },
    {
      id: "MNT-004", computerId: "PC-LAB-A-02",
      maintenanceType: "Component Replacement", activity: "Display cable inspection and monitor replacement",
      technician: "Engr. Roberto Lim", scheduledDate: "2026-08-25",
      status: "Scheduled", notes: "Waiting for replacement monitor delivery from supplier.",
    },
    {
      id: "MNT-005", computerId: "PC-LAB-B-01",
      maintenanceType: "Component Replacement", activity: "Keyboard replacement — keys D and F unresponsive",
      technician: "Engr. Carlo Reyes", scheduledDate: "2026-08-22",
      status: "In Progress", notes: "New keyboard requisitioned from supplies.",
    },
    {
      id: "MNT-006", computerId: "PC-LAB-B-02",
      maintenanceType: "Preventive Cleaning", activity: "Quarterly preventive maintenance — cleaning and OS updates",
      technician: "Engr. Roberto Lim", scheduledDate: "2026-09-01",
      status: "Scheduled",
    },
    {
      id: "MNT-007", computerId: "PC-FACULTY-01",
      maintenanceType: "Software Update", activity: "macOS Sonoma upgrade and security patch application",
      technician: "Engr. Carlo Reyes", scheduledDate: "2026-08-08", completedDate: "2026-08-08",
      status: "Completed", notes: "All applications verified compatible post-upgrade.",
    },
  ],
  auditLogs: [
    { id: "LOG-001", timestamp: "2026-08-05 08:14", role: "staff", actor: "Juan dela Cruz", action: "Problem Reported", details: "Reported problem PRB-002 on PC-LAB-A-04: System fails to boot" },
    { id: "LOG-002", timestamp: "2026-08-05 09:30", role: "admin", actor: "Admin", action: "Problem Status Updated", details: "PRB-002 status changed: Open → In Progress" },
    { id: "LOG-003", timestamp: "2026-08-08 10:00", role: "admin", actor: "Admin", action: "Maintenance Completed", details: "MNT-007 marked Completed — macOS Sonoma upgrade on PC-FACULTY-01" },
    { id: "LOG-004", timestamp: "2026-08-10 13:22", role: "staff", actor: "Maria Santos", action: "Problem Reported", details: "Reported problem PRB-001 on PC-LAB-A-02: Screen flickers" },
    { id: "LOG-005", timestamp: "2026-08-12 08:00", role: "admin", actor: "Admin", action: "Maintenance Started", details: "MNT-003 status changed: Scheduled → In Progress" },
    { id: "LOG-006", timestamp: "2026-08-14 17:00", role: "admin", actor: "Admin", action: "Maintenance Completed", details: "MNT-003 marked Completed — HDD replacement on PC-LAB-A-04" },
    { id: "LOG-007", timestamp: "2026-08-14 17:05", role: "admin", actor: "Admin", action: "Problem Status Updated", details: "PRB-002 status changed: In Progress → Resolved" },
    { id: "LOG-008", timestamp: "2026-08-15 09:00", role: "admin", actor: "Admin", action: "Maintenance Completed", details: "MNT-001 marked Completed — Preventive cleaning on PC-LAB-A-01" },
    { id: "LOG-009", timestamp: "2026-08-18 14:05", role: "staff", actor: "Ana Reyes", action: "Problem Reported", details: "Reported problem PRB-003 on PC-LAB-B-01: Keyboard keys unresponsive" },
    { id: "LOG-010", timestamp: "2026-08-20 10:30", role: "staff", actor: "Rosa Mendoza", action: "Problem Reported", details: "Reported problem PRB-005 on PC-LAB-A-01: Mouse cursor freezes" },
    { id: "LOG-011", timestamp: "2026-08-22 08:45", role: "admin", actor: "Admin", action: "Maintenance Started", details: "MNT-005 status changed: Scheduled → In Progress" },
  ],
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

type Variant = "green" | "yellow" | "red" | "gray" | "blue" | "orange";

const variants: Record<Variant, string> = {
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  yellow: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  gray: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  blue: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export function getComputerStatusVariant(s: string): Variant {
  if (s === "Active" || s === "Operational") return "green";
  if (s === "Needs Maintenance") return "yellow";
  if (s === "Under Repair") return "orange";
  if (s === "Decommissioned") return "gray";
  return "gray";
}

export function getProblemStatusVariant(s: string): Variant {
  if (s === "Open") return "red";
  if (s === "In Progress") return "yellow";
  if (s === "Resolved") return "green";
  if (s === "Closed") return "gray";
  return "gray";
}

export function getMaintenanceStatusVariant(s: string): Variant {
  if (s === "Completed") return "green";
  if (s === "Scheduled") return "blue";
  if (s === "Cancelled") return "gray";
  return "gray";
}

interface Props {
  label: string;
  variant: Variant;
}

export default function StatusBadge({ label, variant }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}

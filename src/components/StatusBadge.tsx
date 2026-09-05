type Variant = "green" | "yellow" | "red" | "gray" | "blue" | "orange" | "purple";

const variantStyles: Record<Variant, { bg: string; text: string; border: string; dot: string }> = {
  green: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  yellow: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  red: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
  },
  blue: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  gray: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
  },
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
  if (s === "In Progress") return "yellow";
  if (s === "Cancelled") return "gray";
  return "gray";
}

interface Props {
  label: string;
  variant: Variant;
  showDot?: boolean;
}

export default function StatusBadge({ label, variant, showDot = true }: Props) {
  const style = variantStyles[variant] || variantStyles.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium tracking-wide transition-colors ${style.bg} ${style.text} ${style.border}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}

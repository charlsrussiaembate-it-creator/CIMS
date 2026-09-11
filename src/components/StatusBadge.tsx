type Variant = "green" | "yellow" | "red" | "gray" | "blue" | "orange" | "purple";

const variantStyles: Record<Variant, { bg: string; text: string; border: string; dot: string }> = {
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
  yellow: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-600",
  },
  red: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    dot: "bg-orange-600",
  },
  blue: {
    bg: "bg-indigo-50",
    text: "text-[#28166F]",
    border: "border-indigo-200",
    dot: "bg-[#28166F]",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-600",
  },
  gray: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold tracking-wide transition-colors ${style.bg} ${style.text} ${style.border}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}

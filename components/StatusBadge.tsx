import { Clock, Send, PenLine, Package, CheckCircle, CreditCard } from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft:           { label: "Draft",     color: "bg-gray-100 text-gray-600",     icon: Clock },
  sent:            { label: "Sent",      color: "bg-blue-100 text-blue-700",     icon: Send },
  signed:          { label: "Signed",    color: "bg-purple-100 text-purple-700", icon: PenLine },
  ordered:         { label: "Ordered",   color: "bg-orange-100 text-orange-700", icon: Package },
  accepted:        { label: "Accepted",  color: "bg-green-100 text-green-700",   icon: CheckCircle },
  pending_payment: { label: "Pending Payment", color: "bg-amber-100 text-amber-700", icon: CreditCard },
};

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status || "Unknown", color: "bg-gray-100 text-gray-600", icon: Clock };
  const Icon = meta.icon;
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap " + meta.color}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

export function isWonStatus(status: string): boolean {
  return status === "signed" || status === "ordered" || status === "accepted" || status === "pending_payment";
}

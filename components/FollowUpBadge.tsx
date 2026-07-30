import { Mail, Clock, CheckCircle } from "lucide-react";
import type { FollowUpStatus } from "@/lib/followups/types";

export default function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  if (status.kind === "action_due") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-red-100 text-red-700">
        <Mail size={11} />
        {status.step.actionLabel}
      </span>
    );
  }
  if (status.kind === "waiting") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-500">
        <Clock size={11} />
        Waiting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-green-100 text-green-700">
      <CheckCircle size={11} />
      Follow-up Complete
    </span>
  );
}

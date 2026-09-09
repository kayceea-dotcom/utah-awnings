import type { FollowUpStepConfig, FollowUpStatus, ProposalFollowUpTimestamps } from "./types";
import { FOLLOWUP_STEPS } from "./steps";
import { isWonStatus } from "@/components/StatusBadge";

const DAY_MS = 24 * 60 * 60 * 1000;

// Single pass over the ordered, enabled steps: the first step without a
// timestamp is either due now (no gate, or its gate has elapsed) or waiting
// on its delay. Falls through to "complete" once every step has a timestamp.
// Adding a step to steps.ts requires no changes here.
export function getFollowUpStatus(
  timestamps: ProposalFollowUpTimestamps,
  proposalStatus?: string,
  steps: FollowUpStepConfig[] = FOLLOWUP_STEPS,
  now: Date = new Date()
): FollowUpStatus {
  // A signed/accepted/pending-payment/ordered job has already converted -
  // chasing it with "send a follow-up" nudges makes no sense regardless of
  // which timestamps are still unset (e.g. a rep skipped straight to an
  // in-person signature without ever sending the earlier follow-up steps).
  if (proposalStatus && isWonStatus(proposalStatus)) {
    return { kind: "complete" };
  }

  const enabledSteps = steps.filter((s) => s.enabled);

  for (const step of enabledSteps) {
    const sentAt = timestamps[step.fieldName];
    if (sentAt) continue;

    if (step.prevFieldName === null || step.delayDays === null) {
      return { kind: "action_due", step };
    }

    const prevSentAt = timestamps[step.prevFieldName];
    if (!prevSentAt) {
      return { kind: "waiting", nextStep: step, dueAt: "" };
    }

    const dueAtMs = new Date(prevSentAt).getTime() + step.delayDays * DAY_MS;
    if (now.getTime() >= dueAtMs) {
      return { kind: "action_due", step };
    }
    return { kind: "waiting", nextStep: step, dueAt: new Date(dueAtMs).toISOString() };
  }

  return { kind: "complete" };
}

export function getActionableStep(
  timestamps: ProposalFollowUpTimestamps,
  proposalStatus?: string,
  steps: FollowUpStepConfig[] = FOLLOWUP_STEPS,
  now: Date = new Date()
): FollowUpStepConfig | null {
  const status = getFollowUpStatus(timestamps, proposalStatus, steps, now);
  return status.kind === "action_due" ? status.step : null;
}

// Filter values are step keys ("initial" | "followup1" | ...) plus "waiting" / "complete" / "all".
export function matchesFollowUpFilter(status: FollowUpStatus, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "waiting") return status.kind === "waiting";
  if (filter === "complete") return status.kind === "complete";
  return status.kind === "action_due" && status.step.key === filter;
}

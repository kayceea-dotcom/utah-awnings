export type FollowUpChannel = "email" | "sms";

// Keys must match the DB columns added in supabase/migrations/20260730_proposal_followups.sql.
// Adding a 5th step later means adding one more key here + one more DB column.
export interface ProposalFollowUpTimestamps {
  initial_email_sent_at: string | null;
  followup1_sent_at: string | null;
  followup2_sent_at: string | null;
  final_followup_sent_at: string | null;
}

export type FollowUpTimestampField = keyof ProposalFollowUpTimestamps;

// Loosely typed to match this codebase's existing convention in
// app/api/proposal/route.ts (no generated Supabase types exist).
export interface FollowUpEmailContext {
  customerName: string;
  customerEmail: string;
  totalJobSale: number;
  depositAmount: number;
  balanceDue: number;
  proposalUrl: string;
  logoUrl: string | null;
}

export interface FollowUpStepConfig {
  key: string; // stable id: "initial" | "followup1" | "followup2" | "final"
  label: string; // "1st Follow-up" - used for filter labels
  actionLabel: string; // exact status/button string, e.g. "Send 1st Follow-up"
  fieldName: FollowUpTimestampField; // column stamped when this step sends
  prevFieldName: FollowUpTimestampField | null; // gating column; null only for the first step
  delayDays: number | null; // days after prevFieldName's timestamp; null for the first step
  channel: FollowUpChannel; // "sms" reserved for future use, not implemented
  enabled: boolean; // config-level kill switch
  subject: string | null; // null when sendRoute is "existing-proposal-route"
  buildHtml: ((ctx: FollowUpEmailContext) => string) | null;
  // Which API route sends + stamps this step. "initial" reuses the existing
  // proposal-send flow; everything else goes through the follow-up engine route.
  sendRoute: "existing-proposal-route" | "followup-engine-route";
}

export type FollowUpStatus =
  | { kind: "action_due"; step: FollowUpStepConfig }
  | { kind: "waiting"; nextStep: FollowUpStepConfig; dueAt: string }
  | { kind: "complete" };

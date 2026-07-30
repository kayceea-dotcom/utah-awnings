import type { FollowUpStepConfig } from "./types";
import { buildFollowup1Html, buildFollowup2Html, buildFinalFollowupHtml } from "./templates";

// The ONLY file to edit for a 5th/6th step (plus one new DB column + a
// template function in templates.ts). engine.ts iterates this array
// generically and needs no changes when a step is added.
//
// Note: disabling a middle step (enabled: false) breaks the chain unless the
// next step's prevFieldName is repointed to an earlier, still-active field -
// that gate timestamp would otherwise never get stamped. This is a config-time
// concern to be aware of, not something the engine works around automatically.
export const FOLLOWUP_STEPS: FollowUpStepConfig[] = [
  {
    key: "initial",
    label: "Initial Email",
    actionLabel: "Send Initial Email",
    fieldName: "initial_email_sent_at",
    prevFieldName: null,
    delayDays: null,
    channel: "email",
    enabled: true,
    subject: null,
    buildHtml: null,
    sendRoute: "existing-proposal-route",
  },
  {
    key: "followup1",
    label: "1st Follow-up",
    actionLabel: "Send 1st Follow-up",
    fieldName: "followup1_sent_at",
    prevFieldName: "initial_email_sent_at",
    delayDays: 7,
    channel: "email",
    enabled: true,
    subject: "Just checking in on your Utah Awnings proposal",
    buildHtml: buildFollowup1Html,
    sendRoute: "followup-engine-route",
  },
  {
    key: "followup2",
    label: "2nd Follow-up",
    actionLabel: "Send 2nd Follow-up",
    fieldName: "followup2_sent_at",
    prevFieldName: "followup1_sent_at",
    delayDays: 30,
    channel: "email",
    enabled: true,
    subject: "Still thinking it over? Your Utah Awnings quote is ready",
    buildHtml: buildFollowup2Html,
    sendRoute: "followup-engine-route",
  },
  {
    key: "final",
    label: "Final Follow-up",
    actionLabel: "Send Final Follow-up",
    fieldName: "final_followup_sent_at",
    prevFieldName: "followup2_sent_at",
    delayDays: 90,
    channel: "email",
    enabled: true,
    subject: "Final reminder: your Utah Awnings proposal",
    buildHtml: buildFinalFollowupHtml,
    sendRoute: "followup-engine-route",
  },
];

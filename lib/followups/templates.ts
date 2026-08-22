import type { FollowUpEmailContext } from "./types";

const fmt = (n: number) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

// The body is editable by a rep before sending (preview-then-send flow), so
// it's now real user input landing in an actual email - must be escaped, not
// trusted as safe HTML like the rest of the template.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bodyToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

export const FOLLOWUP1_DEFAULT_BODY =
  "Just following up on the proposal we sent for your project. Your quote is still available — click below any time to review the details or get started with your deposit.";
export const FOLLOWUP2_DEFAULT_BODY =
  "It's been a few weeks since we sent your Utah Awnings proposal. We know shade projects take some planning — your quote is still on file and ready whenever you are. Let us know if you have questions or want to adjust anything before moving forward.";
export const FINAL_FOLLOWUP_DEFAULT_BODY =
  "This is our final check-in on your Utah Awnings proposal from a few months back. Pricing and availability can change, so if you'd still like to move forward, now's a great time to lock it in. Reach out any time — we're happy to help.";

function logoBlock(logoUrl: string | null): string {
  return logoUrl
    ? `<img src="${logoUrl}" alt="Utah Awnings" style="max-height: 80px; max-width: 240px; object-fit: contain; margin-bottom: 8px;" />`
    : `<div style="display: inline-block; background: #CC2229; border-radius: 12px; padding: 12px 20px; margin-bottom: 8px;">
         <span style="color: white; font-size: 22px; font-weight: 900;">UA</span>
       </div>
       <h1 style="color: #1a1a1a; margin: 8px 0 4px;">Utah Awnings</h1>`;
}

function wrapFollowUpEmail(opts: {
  ctx: FollowUpEmailContext;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
}): string {
  const { ctx, heading, bodyHtml, ctaLabel } = opts;
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

    <div style="text-align: center; margin-bottom: 32px;">
      ${logoBlock(ctx.logoUrl)}
      <p style="color: #666; margin: 0; font-size: 14px;">Your Complete Shade Solution</p>
    </div>

    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">${heading}</h2>
    <p style="color: #444; line-height: 1.6; margin-bottom: 16px;">${bodyHtml}</p>

    <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #666; padding: 4px 0;">Contract Total</td>
          <td style="text-align: right; font-weight: bold; color: #CC2229; font-size: 18px;">${fmt(ctx.totalJobSale)}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Deposit Required</td>
          <td style="text-align: right; font-weight: bold;">${fmt(ctx.depositAmount)}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Due on Completion</td>
          <td style="text-align: right; font-weight: bold;">${fmt(ctx.balanceDue)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctx.proposalUrl}"
         style="background: #CC2229; color: white; padding: 14px 32px; border-radius: 10px;
                text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
        ${ctaLabel}
      </a>
    </div>

    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      Questions? Call us at <strong>801-979-5423</strong> or reply to this email.<br>
      1950 W Parkway Blvd, West Valley City, UT 84119 &nbsp;|&nbsp; 174 Old Hwy 91 #27, Hurricane, UT 84737
    </p>

    <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 16px;">
      uaquotepro.com &middot; Utah Awnings Sales Platform
    </p>
  </div>
</body>
</html>
  `;
}

export function buildFollowup1Html(ctx: FollowUpEmailContext, customBody?: string): string {
  return wrapFollowUpEmail({
    ctx,
    heading: `Hi ${ctx.customerName},`,
    bodyHtml: bodyToHtml(customBody ?? FOLLOWUP1_DEFAULT_BODY),
    ctaLabel: "Review Your Proposal",
  });
}

export function buildFollowup2Html(ctx: FollowUpEmailContext, customBody?: string): string {
  return wrapFollowUpEmail({
    ctx,
    heading: `Hi ${ctx.customerName},`,
    bodyHtml: bodyToHtml(customBody ?? FOLLOWUP2_DEFAULT_BODY),
    ctaLabel: "Review Your Proposal",
  });
}

export function buildFinalFollowupHtml(ctx: FollowUpEmailContext, customBody?: string): string {
  return wrapFollowUpEmail({
    ctx,
    heading: `Hi ${ctx.customerName},`,
    bodyHtml: bodyToHtml(customBody ?? FINAL_FOLLOWUP_DEFAULT_BODY),
    ctaLabel: "Review Your Proposal",
  });
}

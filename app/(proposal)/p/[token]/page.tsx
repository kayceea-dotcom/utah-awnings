"use client";

import { useState, useEffect, useRef } from "react";
import CoverDiagram from "@/components/quote/CoverDiagram";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Check, PenLine, CreditCard, Banknote, Phone } from "lucide-react";
import { estimateMonthlyPayment, HEARTH_PREQUALIFY_URL, FINANCING_APR, FINANCING_TERM_YEARS } from "@/lib/financing";
import type { BeamConfig } from "@/lib/pricing/types";
import { beamTypeLabel } from "@/lib/pricing/shared";
import { TERMS } from "@/lib/contractTerms";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ProposalPage() {
  const params = useParams();
  const token = params.token as string;
  const [proposal, setProposal] = useState<Record<string, unknown> | null>(null);
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"view" | "sign" | "payment" | "done">("view");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: prop } = await supabase
        .from("proposals")
        .select("*, quotes(*, customers(*), companies(*))")
        .eq("token", token)
        .single();

      if (prop) {
        setProposal(prop);
        const q = prop.quotes as Record<string, unknown>;
        setQuote(q);
        setCustomer(q.customers as Record<string, unknown>);
        setCompany(q.companies as Record<string, unknown>);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  }

  function stopDrawing() { setIsDrawing(false); }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function handleSign() {
    if (!hasSigned) return;
    setSigning(true);
    const canvas = canvasRef.current;
    const sigData = canvas?.toDataURL("image/png") || "";

    await supabase.from("proposals").update({
      signed_at: new Date().toISOString(),
      signature_data: sigData,
      status: "signed",
    }).eq("token", token);

    // Alert the salesman + office that a customer just signed - fire and
    // forget so a slow email send never holds up the customer's flow.
    fetch("/api/proposal/signed-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token }),
    }).catch(console.error);

    setStep("payment");
    setSigning(false);
  }

  async function handlePaymentChoice(method: string) {
    setPaymentMethod(method);
    setSubmitting(true);

    await supabase.from("proposals").update({
      payment_method: method,
      status: method === "card" ? "pending_payment" : "accepted",
    }).eq("token", token);

    if (method === "card") {
      // Stripe payment - coming soon
      setStep("done");
    } else {
      setStep("done");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your proposal...</p>
      </div>
    );
  }

  if (!proposal || !quote || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-800 font-semibold mb-2">Proposal not found</p>
          <p className="text-gray-500 text-sm">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const q = quote as Record<string, unknown>;
  const c = customer as Record<string, unknown>;
  const co = company as Record<string, unknown>;

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {paymentMethod === "card" ? "Contract received!" : "You are all set!"}
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            Thank you for choosing Utah Awnings. We will be in touch shortly to confirm your install date.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <p className="text-blue-800 text-sm font-semibold mb-1">Next Steps</p>
            <p className="text-blue-700 text-sm">
              {paymentMethod === "card" && "Online card payment isn't available yet - a Utah Awnings team member will call you shortly to collect your deposit securely over the phone."}
              {paymentMethod === "check" && "Please make your deposit check payable to Utah Awnings and mail or deliver it to our office."}
              {paymentMethod === "cash" && "Please bring your deposit payment to our office or arrange with your sales rep."}
              {paymentMethod === "financing" && "We've opened our financing partner's prequalification page in a new tab - complete that form to see your options. A Utah Awnings team member will also follow up."}
            </p>
          </div>
          <p className="text-gray-400 text-xs mt-6">
            Questions? Call us at 801-979-5423
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pb-16">

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              {co.logo_url ? (
                <img src={co.logo_url as string} alt="Utah Awnings" className="h-12 object-contain mb-2" />
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#CC2229" }}>
                    <span className="text-white font-black text-sm">UA</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">Utah Awnings</span>
                </div>
              )}
              <p className="text-xs text-gray-500">1950 W Parkway Blvd, West Valley City, UT 84119</p>
              <p className="text-xs text-gray-500">174 Old Hwy 91 #27, Hurricane, UT 84737</p>
              <p className="text-xs text-gray-500">801-979-5423</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Contract & Invoice</p>
              <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-gray-100 pt-4">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{c.name as string}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.phone as string}</span></div>
            <div><span className="text-gray-500">Address:</span> <span className="font-medium">{c.address as string}</span></div>
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.email as string}</span></div>
            <div><span className="text-gray-500">City:</span> <span className="font-medium">{c.city as string}</span></div>
            <div><span className="text-gray-500">Zip:</span> <span className="font-medium">{c.zip as string}</span></div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Job Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-gray-500">Style:</span> <span className="font-medium capitalize">{q.style as string}</span></div>
            <div><span className="text-gray-500">Panel Type:</span> <span className="font-medium">{q.panel_type as string}</span></div>
            <div><span className="text-gray-500">Panel Color:</span> <span className="font-medium">{q.color as string}</span></div>
            {(() => {
              const inp = q.inputs as Record<string, unknown> | null;
              const trimColor = (inp?.colorGutterFascia as string) || "";
              return trimColor ? <div><span className="text-gray-500">Gutter/Fascia Color:</span> <span className="font-medium">{trimColor}</span></div> : null;
            })()}
            <div><span className="text-gray-500">Beam:</span> <span className="font-medium">{beamTypeLabel(q.beam_type as string)}</span></div>
            {(() => {
              const inp = q.inputs as Record<string, unknown> | null;
              const trimColor = (inp?.colorPostsBeam as string) || "";
              return trimColor ? <div><span className="text-gray-500">Posts/Beam Color:</span> <span className="font-medium">{trimColor}</span></div> : null;
            })()}
            <div><span className="text-gray-500">Wrap:</span> <span className="font-medium">{q.wrap as string}</span></div>
            <div><span className="text-gray-500">End Cut:</span> <span className="font-medium">{q.end_cut as string}</span></div>
            {q.fan_beam ? <div><span className="text-gray-500">Fan Beam:</span> <span className="font-medium">{String(q.fan_beam)}</span></div> : null}
            {q.notes ? <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="font-medium">{String(q.notes)}</span></div> : null}
          </div>
        </div>

        {/* 3D Render (falls back to the 2D diagram if none was generated) */}
        {q.render_url ? (
          <div className="mb-4">
            <img src={q.render_url as string} alt="3D render of your patio cover" className="w-full rounded-lg border border-gray-200" />
          </div>
        ) : null}

        {/* Cover Diagram */}
        {!q.render_url && (() => {
          const inp = q.inputs as Record<string, unknown> | null;
          if (!inp) return null;
          // Mirror each product's own quote-builder rules for whether rafter tails
          // show: Pergola's rafters are always structural (no wrap kit involved),
          // IRP's wrap kit never includes rafter tails, and Flat Panel/W-Pan only
          // show them when a wrap kit is selected and Rafter Tails is toggled on.
          const productType = String(q.product_type || q.style || "");
          const showRafterTails = productType === "pergola"
            ? true
            : productType === "irp"
              ? false
              : inp.wrapType !== "none" && !!inp.rafterTails;
          return (
            <div className="mb-4">
              <CoverDiagram
                projection1={Number(inp.projection1) || 0}
                width1={Number(inp.width1) || 0}
                projection2={Number(inp.projection2) || 0}
                width2={Number(inp.width2) || 0}
                jogType={String(inp.jogType || "ground")}
                posts1={Number(inp.posts1) || 0}
                posts2={Number(inp.posts2) || 0}
                downspouts={Number(inp.downspouts) || 1}
                downspoutSide={String(inp.downspoutSide || "right")}
                showRafterTails={showRafterTails}
                beams={(inp.beams as BeamConfig[]) || []}
                beamType1={String(inp.beamType1 || "3x8")}
                beamType2={String(inp.beamType2 || "3x8")}
              />
            </div>
          );
        })()}

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Contract Summary</p>
            <p className="text-xs text-gray-400">
              Install: {q.estimated_install_date ? new Date(q.estimated_install_date as string).toLocaleDateString() : "TBD"}
            </p>
          </div>

          {/* Trust builders */}
          <div className="flex flex-col gap-2.5 pb-6 mb-6 border-b border-gray-100">
            {["Lifetime Material Warranty", "15-Year Labor Warranty", "Professionally Engineered & Installed"].map((label) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-gray-500" strokeWidth={3} />
                </span>
                <span className="text-sm text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Down payment / balance */}
          <div className="space-y-4 mb-7">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-400">Today&apos;s Down Payment ({q.deposit_pct as number}%)</span>
              <span className="text-lg font-bold text-gray-900">{fmt(q.deposit_amount as number)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-400">Balance Due Upon Completion</span>
              <span className="text-lg font-bold text-gray-900">{fmt(q.balance_due as number)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 mb-7" />

          {/* Total investment + financing */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Total Investment</p>
            <p className="text-4xl sm:text-5xl font-extrabold tracking-tight" style={{ color: "#222222" }}>
              {fmt(q.total_job_sale as number)}
            </p>
            <p className="mt-3 text-xl sm:text-2xl font-bold" style={{ color: "#2E7D32" }}>
              As low as {fmt(estimateMonthlyPayment(q.total_job_sale as number, FINANCING_APR, FINANCING_TERM_YEARS))}/mo with financing
            </p>
            <p className="text-xs text-gray-400 mt-1.5">Subject to credit approval.</p>
          </div>

          <p className="text-xs text-gray-400 mt-7 italic text-center">Install dates are approximations and you will be notified the day before the install.</p>
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Terms & Conditions</p>
          <div className="space-y-3">
            {TERMS.map((term, i) => (
              <div key={i} className="flex gap-3 text-xs text-gray-600 leading-relaxed">
                <span className="font-bold text-gray-400 flex-shrink-0">{i + 1}.</span>
                <p>{term}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Signature */}
        {step === "view" && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Ready to Accept?</p>
            <p className="text-sm text-gray-600 mb-4">By signing below, you agree to the terms and conditions above.</p>
            <button
              onClick={() => setStep("sign")}
              className="btn-primary w-full"
            >
              <PenLine size={16} />
              Review & Sign
            </button>
          </div>
        )}

        {step === "sign" && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Sign Below</p>
            <p className="text-sm text-gray-600 mb-3">Use your finger or mouse to sign in the box below.</p>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-3 touch-none">
              <canvas
                ref={canvasRef}
                width={560}
                height={150}
                className="w-full bg-gray-50 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={clearSignature} className="btn-secondary flex-1 text-sm">
                Clear
              </button>
              <button
                onClick={handleSign}
                disabled={!hasSigned || signing}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {signing ? "Saving..." : "Accept & Continue"}
              </button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Deposit Payment</p>
            <p className="text-sm text-gray-600 mb-1">Choose how you would like to pay your deposit of</p>
            <p className="text-2xl font-black mb-4" style={{ color: "#CC2229" }}>{fmt(q.deposit_amount as number)}</p>

            <div className="space-y-3">
              <button
                onClick={() => handlePaymentChoice("card")}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition text-left disabled:opacity-50"
              >
                <CreditCard size={20} style={{ color: "#CC2229" }} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pay by Card</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, Amex — secure online payment</p>
                </div>
              </button>

              <button
                onClick={() => handlePaymentChoice("check")}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition text-left disabled:opacity-50"
              >
                <Banknote size={20} style={{ color: "#CC2229" }} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pay by Check</p>
                  <p className="text-xs text-gray-500">Make payable to Utah Awnings</p>
                </div>
              </button>

              <button
                onClick={() => handlePaymentChoice("cash")}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition text-left disabled:opacity-50"
              >
                <Banknote size={20} className="text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pay by Cash</p>
                  <p className="text-xs text-gray-500">Arrange with your sales rep</p>
                </div>
              </button>

              <button
                onClick={() => {
                  window.open(HEARTH_PREQUALIFY_URL, "_blank", "noopener,noreferrer");
                  handlePaymentChoice("financing");
                }}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition text-left disabled:opacity-50"
              >
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Apply for Financing</p>
                  <p className="text-xs text-gray-500">
                    As low as {fmt(estimateMonthlyPayment(q.total_job_sale as number, FINANCING_APR, FINANCING_TERM_YEARS))}/mo
                    {" "}({FINANCING_TERM_YEARS}-year term, {FINANCING_APR}% APR)
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

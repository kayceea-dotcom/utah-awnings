"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, PenLine, CreditCard, Banknote, Phone } from "lucide-react";

const TERMS = [
  "Contractor to provide the improvements/remodeling/reconstruction/rehabilitation (hereinafter the work), in a workmanlike manner and in accordance with the plans and specifications provided or in accordance with the attached Scope of Work to the property listed above. Contractor is not responsible to repair existing conditions on home unless specified in this agreement. Contractor will build assuming that the property is built to meet current building codes, including electrical and framing. Any damage caused by contractor will be repaired/or paid to be repaired by Contractor as if property meets current building code requirements. Also, Contractor assumes that roofing and stucco have been installed properly, including flashing and drip edge, and will not be held responsible for leaking caused by improper installation of roofing and stucco. It is understood that the Awning is not intended to be a waterproof structure and shall not be deemed defective by reason of leakage; however, Contractor shall make every effort to make sure the Awning is as waterproof as possible.",
  "Owner agrees, binds, and obligates him/herself to pay Contractor for the work for the sum listed above. All materials are custom ordered. Therefore, Owner also agrees to pay additional charges for any changes made by the homeowner not included in this contract. Interest at the rate of 1.5% per month will be charged for past due amounts. If Buyer defaults or otherwise breaches this agreement, Buyer agrees to pay all court costs and reasonable attorney fees incurred by Contractor in the collection under or enforcement of this agreement.",
  "Construction will commence and substantial work will be completed on or about the install dates listed below. However, this time period may, at the Contractors option, be extended one day for each day of delay, if construction is delayed due to weather, material shortages, delay of material shipment, Owner delays, or acts of God. Failure of Contractor to timely complete shall not be considered default. Note: Any time Owner has taken time off work to supervise install will be made at their own discretion and WILL NOT be reimbursed for time missed under any circumstances.",
  "Owner agrees and obligates himself to obtain all necessary and/or required approvals and/or acknowledgments from any Committee whose jurisdiction is relevant to work. Owners shall allow Contractor and employees access to the area being worked on during construction period of 7 oclock a.m. to 5 oclock p.m.",
  "If the property owner chooses to take out the permit, they are liable for the work being done to code and not the contractor. This means that if there are corrections to be done it will be at the cost of the owner and not the contractor.",
];

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
          <h1 className="text-xl font-bold text-gray-900 mb-2">You are all set!</h1>
          <p className="text-gray-500 text-sm mb-4">
            Thank you for choosing Utah Awnings. We will be in touch shortly to confirm your install date.
          </p>
          {paymentMethod !== "card" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <p className="text-blue-800 text-sm font-semibold mb-1">Next Steps</p>
              <p className="text-blue-700 text-sm">
                {paymentMethod === "check" && "Please make your deposit check payable to Utah Awnings and mail or deliver it to our office."}
                {paymentMethod === "cash" && "Please bring your deposit payment to our office or arrange with your sales rep."}
                {paymentMethod === "financing" && "A Utah Awnings team member will contact you shortly to discuss financing options."}
              </p>
            </div>
          )}
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
            <div><span className="text-gray-500">Color:</span> <span className="font-medium">{q.color as string}</span></div>
            <div><span className="text-gray-500">Beam:</span> <span className="font-medium">{q.beam_type as string}</span></div>
            <div><span className="text-gray-500">Wrap:</span> <span className="font-medium">{q.wrap as string}</span></div>
            <div><span className="text-gray-500">End Cut:</span> <span className="font-medium">{q.end_cut as string}</span></div>
            {q.fan_beam ? <div><span className="text-gray-500">Fan Beam:</span> <span className="font-medium">{String(q.fan_beam)}</span></div> : null}
            {q.notes ? <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="font-medium">{String(q.notes)}</span></div> : null}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contract Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Estimated Install Date</span>
              <span className="font-semibold">{q.estimated_install_date ? new Date(q.estimated_install_date as string).toLocaleDateString() : "TBD"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Contract Total</span>
              <span className="font-bold text-lg" style={{ color: "#CC2229" }}>{fmt(q.total_job_sale as number)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Down Payment ({q.deposit_pct as number}%)</span>
              <span className="font-semibold">{fmt(q.deposit_amount as number)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Due on Completion</span>
              <span className="font-semibold">{fmt(q.balance_due as number)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">Install dates are approximations and you will be notified the day before the install.</p>
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
                onClick={() => handlePaymentChoice("financing")}
                disabled={submitting}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition text-left disabled:opacity-50"
              >
                <Phone size={20} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Apply for Financing</p>
                  <p className="text-xs text-gray-500">We will contact you with options</p>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

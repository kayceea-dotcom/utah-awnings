import { useEffect, useState } from "react";

export type DiscountOption = "cash" | "flat200" | "flat600" | "custom";

export const DISCOUNT_OPTIONS: { value: DiscountOption; label: string }[] = [
  { value: "cash", label: "Check/Cash Discount (waives CC fee)" },
  { value: "flat200", label: "$200 Off" },
  { value: "flat600", label: "$600 Off" },
  { value: "custom", label: "Custom" },
];

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Keeps the discount pinned to a chosen option as pricing changes - "cash"
// tracks the job's current CC fee live (so paying by check/cash exactly
// offsets the credit-card markup baked into the price), the flat options
// stay fixed. Picking "Custom" freezes it so the rep can type any $ amount.
export function useDiscountOption(opts: {
  ccFee: number;
  discount: number;
  setDiscount: (discount: number) => void;
}) {
  const [option, setOption] = useState<DiscountOption>("custom");
  const { ccFee, discount, setDiscount } = opts;

  useEffect(() => {
    if (option === "custom") return;
    const target = option === "cash" ? round2(ccFee) : option === "flat200" ? 200 : 600;
    if (Math.abs(target - discount) > 0.001) {
      setDiscount(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option, ccFee]);

  return {
    option,
    setOption,
    reset: () => setOption("custom"),
  };
}

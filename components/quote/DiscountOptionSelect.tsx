"use client";

import { ChevronDown } from "lucide-react";
import Field from "@/components/quote/Field";
import { DISCOUNT_OPTIONS, type DiscountOption } from "@/lib/hooks/useDiscountOption";

export default function DiscountOptionSelect({ option, onOptionChange, discount, onDiscountChange }: {
  option: DiscountOption;
  onOptionChange: (o: DiscountOption) => void;
  discount: number;
  onDiscountChange: (d: number) => void;
}) {
  return (
    <div className="col-span-2 space-y-2">
      <Field label="Discount" hint={option === "custom" ? "Flat $ off the final Total Job Sale" : undefined}>
        <div className="relative">
          <select
            className="select pr-8"
            value={option}
            onChange={(e) => onOptionChange(e.target.value as DiscountOption)}
          >
            {DISCOUNT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown size={15} className="text-gray-400" />
          </div>
        </div>
      </Field>
      {option === "custom" && (
        <input
          type="number"
          className="input"
          value={discount === 0 ? "" : discount}
          placeholder="0"
          onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
        />
      )}
    </div>
  );
}

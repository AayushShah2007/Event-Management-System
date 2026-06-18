"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Details", href: "/checkout/details" },
  { label: "Payment", href: "/checkout" },
  { label: "Confirmation", href: "/checkout/approval" },
];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const done = current > i;
          const active = current === i;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    done ? "bg-green-500 text-white" : active ? "bg-crimson-600 text-white ring-2 ring-crimson-500/30" : "bg-charcoal-800 text-gray-500 border border-white/10"
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <p className={cn("text-xs mt-1.5 font-medium", active ? "text-white" : done ? "text-green-500" : "text-gray-500")}>{s.label}</p>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-colors duration-300", done ? "bg-green-500" : "bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

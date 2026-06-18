"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface OTPVerificationProps {
  value: string;
  type: "phone" | "email";
  onVerified: () => void;
  isVerified: boolean;
  isDark: boolean;
  disabled?: boolean;
}

export function OTPVerification({ value, type, onVerified, isVerified, isDark, disabled }: OTPVerificationProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    if (!value) return;
    setSending(true);
    setError("");

    if (type === "phone") {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      console.log(`[OTP] phone OTP for ${value}: ${code}`);
      await new Promise((r) => setTimeout(r, 800));
      setOtpSent(true);
      setSending(false);
      return;
    }

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setGeneratedOtp(data.otp);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    if (val.length > 1) {
      const digit = val.slice(-1);
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      if (index < 3) inputRefs.current[index + 1]?.focus();
      return;
    }
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError("");
    const entered = otp.join("");
    setEnteredOtp(entered);

    await new Promise((r) => setTimeout(r, 500));

    if (entered === generatedOtp) {
      onVerified();
    } else {
      setError("Invalid OTP. Please try again.");
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setVerifying(false);
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">Verified</span>
      </div>
    );
  }

  return (
    <>
      {!otpSent ? (
        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendOtp}
            disabled={sending || !value || disabled}
            className="h-8"
          >
            {sending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Send className="w-3 h-3 mr-1" />
            )}
            {sending ? "Sending..." : "Verify"}
          </Button>
        </div>
      ) : (
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-gray-400">
              Enter 4-digit OTP sent to {value}
            </p>
            <div className="flex items-center gap-2">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    "w-10 h-10 text-center text-lg font-bold",
                    isDark ? "bg-white/5 text-white" : "bg-gray-50"
                  )}
                  disabled={disabled}
                />
              ))}
              <Button
                type="button"
                size="sm"
                onClick={handleVerify}
                disabled={verifying || otp.join("").length !== 4}
                className="h-10"
              >
                {verifying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </motion.div>
        </div>
      )}
    </>
  );
}

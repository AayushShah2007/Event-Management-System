"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Smartphone, CreditCard, Building2, Wallet, CheckCircle, Zap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Order } from "@/types";
import { formatPrice as fp, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Confetti } from "@/components/shared/Confetti";

export const dynamic = "force-dynamic";

const paymentMethods = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Debit/Credit Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Building2 },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  if (!user) return null;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-crimson-500 animate-spin" /></div>}>
      <CheckoutPaymentContent />
    </Suspense>
  );
}

function CheckoutPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, user, settings } = useAppStore();
  const isDark = theme === "dark";
  const taxRate = settings?.tax_rate ?? 18;

  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState("upi");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await supabaseQuery(`orders?id=eq.${orderId}`, {
          select: "*,event:events(*)",
        });
        const orderData = Array.isArray(data) ? data[0] : data;
        if (!orderData) throw new Error("Order not found");
        if (orderData.status !== "accepted") {
          toast.error("Order not yet accepted");
          router.push("/");
          return;
        }
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, router]);

  const handlePay = async () => {
    if (!order || !user) return;
    setProcessing(true);

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));

    try {
      await supabaseQuery(`orders?id=eq.${orderId}`, {
        method: "PATCH",
        body: { status: "paid" },
      });
      setDone(true);
      toast.success("Payment successful! Your tickets are booked.");
      setTimeout(() => router.push("/"), 2000);
    } catch (error: any) {
      toast.error("Payment failed, please try again");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <Confetti active={true} />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-400">Your tickets have been booked. Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  const event = order?.event as any;

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      <div className={cn("border-b", isDark ? "border-white/5 bg-charcoal-800" : "border-gray-200 bg-white")}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>
          <div className="flex items-center gap-2 text-green-500">
            <Lock className="w-4 h-4" /> <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-crimson-600/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-crimson-500" />
              </div>
              <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
              <p className="text-gray-400 mt-1">Your order has been accepted!</p>
            </div>

            {event && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 mb-6">
                <div className="w-16 h-16 rounded-lg overflow-hidden relative flex-shrink-0">
                  <Image src={event.thumbnail_url || event.image_url || "/placeholder.jpg"} alt={event.title} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-white font-semibold">{event.title}</p>
                  <p className="text-gray-400 text-sm">{event.venue}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-400 mb-3 text-sm font-medium">Pay with</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm transition-all",
                      method === m.id
                        ? "border-crimson-500 bg-crimson-500/10 text-white"
                        : "border-white/10 text-gray-400 hover:border-white/20"
                    )}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Method-specific form fields */}
            <div className="border-t border-white/10 pt-4 mb-6 space-y-4">
              {method === "card" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <Label className="text-gray-400 text-xs">Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))}
                      className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">Cardholder Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-400 text-xs">Expiry</Label>
                      <Input
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCardExpiry(v);
                        }}
                        className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-xs">CVV</Label>
                      <Input
                        type="password"
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {method === "upi" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Label className="text-gray-400 text-xs">UPI ID</Label>
                  <Input
                    placeholder="username@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                  />
                </motion.div>
              )}

              {method === "netbanking" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Label className="text-gray-400 text-xs">Select Bank</Label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full h-10 mt-1 rounded-lg bg-charcoal-900 border border-white/10 text-white px-3 text-sm appearance-none focus:border-crimson-500 focus:ring-1 focus:ring-crimson-500/30 outline-none"
                  >
                    <option value="" className="bg-charcoal-900 text-gray-500">Choose your bank</option>
                    <option value="sbi" className="bg-charcoal-900 text-white">State Bank of India</option>
                    <option value="hdfc" className="bg-charcoal-900 text-white">HDFC Bank</option>
                    <option value="icici" className="bg-charcoal-900 text-white">ICICI Bank</option>
                    <option value="axis" className="bg-charcoal-900 text-white">Axis Bank</option>
                    <option value="kotak" className="bg-charcoal-900 text-white">Kotak Mahindra</option>
                    <option value="yes" className="bg-charcoal-900 text-white">Yes Bank</option>
                  </select>
                </motion.div>
              )}

              {method === "wallet" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Label className="text-gray-400 text-xs">Phone Number</Label>
                  <Input
                    placeholder="98XXXXXXXX"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 mt-1"
                  />
                </motion.div>
              )}
            </div>

            <div className="border-t border-white/10 pt-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-semibold">{fp(order?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-gold-500">{fp((order?.total_amount || 0) + Math.round((order?.total_amount || 0) * (taxRate / 100)))}</span>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handlePay} disabled={processing}>
              {processing ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Zap className="w-5 h-5 mr-2" /> Pay {fp((order?.total_amount || 0) + Math.round((order?.total_amount || 0) * (taxRate / 100)))}</>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">Test mode — no real payment processed</p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

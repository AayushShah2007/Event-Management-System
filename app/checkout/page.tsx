"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Lock, CheckCircle, XCircle, Clock, Tag, Percent, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppStore, useCheckoutStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Event, EventCategory, Order } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

export const dynamic = "force-dynamic";

const paymentMethods = [
  { id: "upi", name: "UPI", icon: Smartphone, description: "Pay using UPI apps" },
  { id: "card", name: "Debit/Credit Card", icon: CreditCard, description: "Visa, Mastercard, RuPay" },
  { id: "netbanking", name: "Net Banking", icon: Building2, description: "All major banks" },
  { id: "wallet", name: "Wallets", icon: Wallet, description: "Paytm, PhonePe, Amazon Pay" },
];

export default function CheckoutPage() {
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, user } = useAppStore();
  const { deliveryAddress } = useCheckoutStore();
  const isDark = theme === "dark";

  const eventId = searchParams.get("event");
  const categoryId = searchParams.get("category");
  const quantity = parseInt(searchParams.get("qty") || "1");

  const [event, setEvent] = useState<Event | null>(null);
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showAvailable, setShowAvailable] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        if (!eventId || !categoryId) {
          router.push("/");
          return;
        }

        const [eventData, categoryData] = await Promise.all([
          supabaseQuery(`events?id=eq.${eventId}`, { select: "*" }).then((r) => r?.[0]),
          supabaseQuery(`event_categories?id=eq.${categoryId}`, { select: "*" }).then((r) => r?.[0]),
        ]);

        if (!eventData || !categoryData) throw new Error("Not found");
        setEvent(eventData);
        setCategory(categoryData);
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, categoryId, router, user]);

  const handlePayment = async () => {
    if (!event || !category || !user) return;

    setProcessing(true);

    try {
      // Create order
      const orderBody: any = {
        user_id: user.id,
        event_id: event.id,
        status: "pending",
        total_amount: category.price * quantity,
        delivery_first_name: deliveryAddress?.first_name || "",
        delivery_last_name: deliveryAddress?.last_name || "",
        delivery_phone: deliveryAddress?.phone || "",
        delivery_email: deliveryAddress?.email || "",
        delivery_address_line1: deliveryAddress?.address_line1 || "",
        delivery_address_line2: deliveryAddress?.address_line2 || "",
        delivery_city: deliveryAddress?.city || "",
        delivery_district: deliveryAddress?.district || "",
        delivery_state: deliveryAddress?.state || "",
        delivery_pincode: deliveryAddress?.pincode || "",
      };
      if (appliedCoupon) {
        orderBody.coupon_code = appliedCoupon.code;
        orderBody.discount_amount = appliedCoupon.discount;
        fetch(`/api/admin/coupons?id=${appliedCoupon.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ used_count: (appliedCoupon.used_count || 0) + 1 }),
        }).catch(() => {});
      }
      const order = await supabaseQuery("orders", {
        method: "POST",
        body: orderBody,
        select: "*",
      }).then((r) => Array.isArray(r) ? r[0] : r);

      if (!order?.id) throw new Error("Failed to create order");

      // Create order items
      await supabaseQuery("order_items", {
        method: "POST",
        body: {
          order_id: order.id,
          category_id: category.id,
          quantity: quantity,
          price: category.price,
        },
        select: "*",
      });

      // Navigate to approval screen
      router.push(`/checkout/approval?order=${order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
      setProcessing(false);
    }
  };

  const subtotal = category ? category.price * quantity : 0;
  const discount = appliedCoupon?.discount || 0;
  const afterDiscount = Math.max(subtotal - discount, 0);
  const taxes = Math.round(afterDiscount * 0.18);
  const total = afterDiscount + taxes;

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <div className="animate-spin w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event || !category) return null;

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("border-b", isDark ? "border-white/5 bg-charcoal-800" : "border-gray-200 bg-white")}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center gap-2 text-green-500">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <CheckoutSteps current={1} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <Card className={cn("p-4", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden relative flex-shrink-0">
                  <Image
                    src={event.thumbnail_url || event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{event.title}</h3>
                  <p className="text-gray-400 text-sm">{event.artist_name}</p>
                  <p className="text-gray-500 text-sm">{event.venue}</p>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                {paymentMethods.map((method) => (
                  <motion.label
                    key={method.id}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                      paymentMethod === method.id
                        ? isDark
                          ? "border-crimson-500 bg-crimson-500/10"
                          : "border-crimson-500 bg-crimson-50"
                        : isDark
                          ? "border-white/10 hover:border-white/20"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <method.icon className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">{method.name}</p>
                        <p className="text-sm text-gray-400">{method.description}</p>
                      </div>
                    </div>
                  </motion.label>
                ))}
              </RadioGroup>
            </Card>

            {/* Payment Details (placeholder for card/netbanking) */}
            {paymentMethod !== "upi" && paymentMethod !== "wallet" && (
              <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                <h2 className="text-xl font-bold text-white mb-4">Card Details</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      className={isDark ? "bg-white/5" : "bg-gray-50"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        className={isDark ? "bg-white/5" : "bg-gray-50"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="•••"
                        className={isDark ? "bg-white/5" : "bg-gray-50"}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Card Holder Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className={isDark ? "bg-white/5" : "bg-gray-50"}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Coupon Code */}
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <p className="text-gray-400 mb-2 text-sm font-medium">Have a coupon code?</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium text-sm">{appliedCoupon.code}</span>
                    <span className="text-green-400 text-xs">({appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : `₹${appliedCoupon.value}`} off)</span>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); }} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 h-10 uppercase"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!couponCode || couponLoading}
                    onClick={async () => {
                      setCouponLoading(true);
                      setCouponError("");
                      try {
                        const res = await fetch("/api/coupons/validate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ code: couponCode, orderAmount: subtotal }),
                        });
                        const data = await res.json();
                        if (data.valid) {
                          setAppliedCoupon(data.coupon);
                        } else {
                          setCouponError(data.error || "Invalid coupon");
                        }
                      } catch {
                        setCouponError("Failed to validate coupon");
                      } finally { setCouponLoading(false) }
                    }}
                    className="h-10"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}

              {!appliedCoupon && (
                <>
                  <button
                    onClick={async () => {
                      if (showAvailable) { setShowAvailable(false); return; }
                      try {
                        const res = await fetch("/api/coupons/visible");
                        const data = await res.json();
                        setAvailableCoupons(Array.isArray(data) ? data : []);
                      } catch { setAvailableCoupons([]) }
                      setShowAvailable(true);
                    }}
                    className="text-xs text-gold-500 hover:text-gold-400 mt-3 inline-flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {showAvailable ? "Hide available coupons" : "Show available coupons"}
                  </button>
                  {showAvailable && availableCoupons.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {availableCoupons.map((c: any) => (
                        <div
                          key={c.code}
                          onClick={() => setCouponCode(c.code)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:border-gold-500/50 transition-all"
                        >
                          <div>
                            <p className="text-white font-mono text-sm font-semibold">{c.code}</p>
                            <p className="text-xs text-gray-500">
                              {c.type === "percentage" ? `${c.value}% off` : `₹${c.value} off`}
                              {c.min_order_amount > 0 && ` · Min ₹${c.min_order_amount}`}
                            </p>
                          </div>
                          {c.expires_at && (
                            <span className="text-[10px] text-gray-600">
                              Exp {new Date(c.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {showAvailable && availableCoupons.length === 0 && (
                    <p className="text-xs text-gray-600 mt-2">No coupons available right now</p>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <Card className={cn("p-6 sticky top-24", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {category.name} × {quantity}
                  </span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Discount ({appliedCoupon.code})</span>
                    <span className="text-green-500 font-semibold">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxes (18%)</span>
                  <span className="text-white">{formatPrice(taxes)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-gold-500">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Pay {formatPrice(total)}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By clicking Pay, you agree to our Terms & Conditions
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
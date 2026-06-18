"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, MapPin, Home, Briefcase, Building2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore, useCheckoutStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import { OTPVerification } from "@/components/shared/OTPVerification";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import type { Event, EventCategory } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { DistrictSelect } from "@/components/ui/DistrictSelect";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function DetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full" /></div>}>
      <DetailsContent />
    </Suspense>
  );
}

function DetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, user, settings } = useAppStore();
  const isDark = theme === "dark";
  const requireOtp = settings.require_otp !== false;

  const eventId = searchParams.get("event");
  const categoryId = searchParams.get("category");
  const quantity = parseInt(searchParams.get("qty") || "1");

  const checkoutStore = useCheckoutStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressLabel, setAddressLabel] = useState<"home" | "work" | "other">(checkoutStore.deliveryAddress?.label || "home");
  const [phoneVerified, setPhoneVerified] = useState(checkoutStore.phoneVerified || false);
  const [emailVerified, setEmailVerified] = useState(checkoutStore.emailVerified || false);

  useEffect(() => {
    if (!requireOtp) {
      setPhoneVerified(true);
      setEmailVerified(true);
    }
  }, [requireOtp]);

  const saved = checkoutStore.deliveryAddress;
  const [form, setForm] = useState({
    first_name: saved?.first_name || "",
    last_name: saved?.last_name || "",
    phone: saved?.phone || "",
    email: saved?.email || "",
    address_line1: saved?.address_line1 || "",
    address_line2: saved?.address_line2 || "",
    landmark: saved?.landmark || "",
    city: saved?.city || "",
    district: saved?.district || "",
    state: saved?.state || "Maharashtra",
    pincode: saved?.pincode || "",
  });

  const fetched = useRef(false);

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    if (fetched.current) return;
    fetched.current = true;

    const fetchData = async () => {
      try {
        if (!eventId || !categoryId) { router.push("/"); return; }

        const [eventArr, catArr] = await Promise.all([
          supabaseQuery(`events?id=eq.${eventId}`, { select: "*" }),
          supabaseQuery(`event_categories?id=eq.${categoryId}`, { select: "*" }),
        ]);
        const ev = Array.isArray(eventArr) ? eventArr[0] : eventArr;
        const cat = Array.isArray(catArr) ? catArr[0] : catArr;
        if (!ev || !cat) throw new Error("Not found");
        setEvent(ev);
        setCategory(cat);
      } catch (err) {
        console.error("Error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, categoryId, router, user]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    checkoutStore.setDeliveryAddress({ ...form, label: addressLabel, phone_verified: phoneVerified, email_verified: emailVerified });
    checkoutStore.setPhoneVerified(phoneVerified);
    checkoutStore.setEmailVerified(emailVerified);
  }, [form, addressLabel, phoneVerified, emailVerified]);

  const isValidPhone = /^\d{10}$/.test(form.phone);
  const phoneError = form.phone.length > 0 && !isValidPhone;
  const allVerified = phoneVerified && emailVerified;
  const canProceed = allVerified && form.first_name && form.last_name && isValidPhone && form.email && form.address_line1 && form.city && form.pincode;

  const handleProceed = async () => {
    if (!user || !canProceed) return;
    setSaving(true);

    checkoutStore.setDeliveryAddress({ ...form, label: addressLabel, phone_verified: phoneVerified, email_verified: emailVerified });

    const { district, ...safeForm } = form;
    const addressData = {
      user_id: user.id,
      ...safeForm,
      label: addressLabel,
      phone_verified: phoneVerified,
      email_verified: emailVerified,
    };

    // Fire-and-forget: try saving to DB but don't wait for it
    supabaseQuery("addresses", { method: "POST", body: addressData })
      .then(() => console.log("Address saved"))
      .catch((e) => console.log("Address save:", e.message));

    // Navigate immediately - don't block on DB save
    router.push(`/checkout?event=${eventId}&category=${categoryId}&qty=${quantity}`);
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <div className="animate-spin w-8 h-8 border-2 border-crimson-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event || !category) return null;

  const subtotal = category.price * quantity;
  const taxes = Math.round(subtotal * 0.18);
  const total = subtotal + taxes;

  const labels = [
    { value: "home" as const, icon: Home, label: "Home" },
    { value: "work" as const, icon: Briefcase, label: "Work" },
    { value: "other" as const, icon: Building2, label: "Other" },
  ];

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
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
            <Shield className="w-4 h-4" />
            <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <CheckoutSteps current={0} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-crimson-600/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-crimson-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Delivery Address</h2>
                    <p className="text-sm text-gray-400">Fill in your contact and address details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      value={form.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      className={isDark ? "bg-white/5 text-white" : "bg-gray-50"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      value={form.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      className={isDark ? "bg-white/5 text-white" : "bg-gray-50"}
                    />
                  </div>

                    <div className="space-y-2">
                    <Label className="text-white" htmlFor="phone">Contact Number *</Label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 10); updateField("phone", val); setPhoneVerified(false); }}
                        disabled={phoneVerified}
                        className={cn("flex-1 min-w-[160px]", isDark ? "bg-white/5 text-white" : "bg-gray-50", phoneError && "border-red-500")}
                      />
                      {requireOtp && (
                        <OTPVerification
                          value={form.phone}
                          type="phone"
                          isVerified={phoneVerified}
                          onVerified={() => setPhoneVerified(true)}
                          isDark={isDark}
                          disabled={!isValidPhone}
                        />
                      )}
                    </div>
                    {phoneError && (
                      <p className="text-xs text-red-500">Enter a valid 10-digit number</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="email">Email ID *</Label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => { updateField("email", e.target.value); setEmailVerified(false); }}
                        disabled={emailVerified}
                        className="flex-1 min-w-[160px] bg-white/5 text-white"
                      />
                      {requireOtp && (
                        <OTPVerification
                          value={form.email}
                          type="email"
                          isVerified={emailVerified}
                          onVerified={() => setEmailVerified(true)}
                          isDark={isDark}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <hr className={cn("my-6", isDark ? "border-white/10" : "border-gray-200")} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      placeholder="House/Flat No., Street, Area"
                      value={form.address_line1}
                      onChange={(e) => updateField("address_line1", e.target.value)}
                      className={isDark ? "bg-white/5 text-white" : "bg-gray-50"}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="address_line2">Address Line 2</Label>
                      <Input
                        id="address_line2"
                        placeholder="Colony, Sector (optional)"
                        value={form.address_line2}
                        onChange={(e) => updateField("address_line2", e.target.value)}
                        className={isDark ? "bg-white/5 text-white" : "bg-gray-50"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="landmark">Landmark</Label>
                      <Input
                        id="landmark"
                        placeholder="Near... (optional)"
                        value={form.landmark}
                        onChange={(e) => updateField("landmark", e.target.value)}
                        className={isDark ? "bg-white/5 text-white" : "bg-gray-50"}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="Mumbai"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className={cn(isDark ? "bg-white/5 text-white" : "bg-gray-50")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="district">District</Label>
                      <DistrictSelect value={form.district} onChange={(v) => updateField("district", v)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value="Maharashtra"
                        disabled
                        className={cn(isDark ? "bg-white/5 text-white" : "bg-gray-50")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white" htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        placeholder="400001"
                        maxLength={6}
                        value={form.pincode}
                        onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className={cn(isDark ? "bg-white/5 text-white" : "bg-gray-50")}
                      />
                    </div>
                  </div>
                </div>

                <hr className={cn("my-6", isDark ? "border-white/10" : "border-gray-200")} />

                <div>
                  <Label className="mb-3 block text-white">Mark this address as</Label>
                  <div className="flex gap-3">
                    {labels.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setAddressLabel(l.value)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                          addressLabel === l.value
                            ? "border-crimson-500 bg-crimson-500/10 text-crimson-500"
                            : isDark
                              ? "border-white/10 text-gray-400 hover:border-white/20"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        <l.icon className="w-4 h-4" />
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <Card className={cn("p-6 sticky top-24", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0">
                  <Image
                    src={event.thumbnail_url || event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                  <p className="text-gray-400 text-xs">{event.venue}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{category.name} × {quantity}</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Taxes (18%)</span>
                  <span className="text-white">{formatPrice(taxes)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-2xl font-bold text-gold-500">{formatPrice(total)}</span>
                </div>
              </div>

              {!allVerified && (
                <div className={cn("p-3 rounded-lg mb-4 text-xs flex items-start gap-2", isDark ? "bg-amber-500/10" : "bg-amber-50")}>
                  <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-amber-600">
                    Verify your phone number and email to proceed
                  </span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                disabled={!canProceed || saving}
                onClick={handleProceed}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By proceeding, you agree to our Terms & Conditions
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

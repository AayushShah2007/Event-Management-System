"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, ShoppingCart, Calendar, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatPrice, formatDate, getInitials, cn } from "@/lib/utils";
import { DistrictSelect } from "@/components/ui/DistrictSelect";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    address_line1: "", address_line2: "", city: "", district: "", state: "Maharashtra", pincode: "",
  });

  useEffect(() => {
    if (!user) { router.push("/"); return; }

    const loadProfile = async () => {
      try {
        const [profiles, orderData, addrData, metaRes] = await Promise.all([
          supabaseQuery(`profiles?user_id=eq.${user.id}`, { select: "*" }).catch(() => null),
          supabaseQuery("orders", { select: "*", params: { "user_id": `eq.${user.id}`, order: "created_at.desc", limit: "10" } }).catch(() => []),
          supabaseQuery("addresses", { params: { "user_id": `eq.${user.id}`, limit: "1", order: "created_at.desc" }, select: "*" }).catch(() => []),
          fetch(`/api/user-meta?userId=${user.id}`).then((r) => r.json()).catch(() => ({ user_metadata: {} })),
        ]);
        const p = Array.isArray(profiles) ? profiles[0] : profiles;
        const addr = Array.isArray(addrData) ? addrData[0] : null;
        const meta = metaRes?.user_metadata || {};
        const ordArr = Array.isArray(orderData) ? orderData : [];
        const evIds = [...new Set(ordArr.map((o: any) => o.event_id).filter(Boolean))];
        if (evIds.length) {
          const evData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${evIds.join(",")})` } }).catch(() => []);
          const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
          ordArr.forEach((o: any) => { o.event = evMap[o.event_id] || null; });
        }
        setProfile(p);
        setOrders(ordArr);
        setForm({
          full_name: p?.full_name || meta.full_name || "",
          email: p?.email || user.email || "",
          phone: p?.phone || meta.phone || "",
          address_line1: addr?.address_line1 || p?.address_line1 || meta.address_line1 || "",
          address_line2: addr?.address_line2 || p?.address_line2 || meta.address_line2 || "",
          city: addr?.city || p?.city || meta.city || "",
          district: addr?.district || p?.district || meta.district || "",
          state: addr?.state || p?.state || meta.state || "Maharashtra",
          pincode: addr?.pincode || p?.pincode || meta.pincode || "",
        });
      } catch (e) { console.log(e) }
      finally { setLoading(false) }
    };
    loadProfile();
  }, [user, router]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileData = { full_name: form.full_name, phone: form.phone };
      if (profile) {
        await supabaseQuery(`profiles?id=eq.${user.id}`, { method: "PATCH", body: profileData });
      } else {
        await supabaseQuery("profiles", { method: "POST", body: { user_id: user.id, ...profileData } });
      }

      const addrData = {
        user_id: user.id,
        first_name: form.full_name.split(" ")[0] || form.full_name,
        last_name: form.full_name.split(" ").slice(1).join(" ") || "",
        phone: form.phone,
        email: form.email,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        district: form.district,
        state: form.state,
        pincode: form.pincode,
        label: "home",
      };

      const existing = await supabaseQuery("addresses", { select: "id", params: { "user_id": `eq.${user.id}`, limit: "1" } }).catch(() => null);
      if (Array.isArray(existing) && existing.length > 0) {
        await supabaseQuery(`addresses?id=eq.${existing[0].id}`, { method: "PATCH", body: addrData });
      } else {
        await supabaseQuery("addresses", { method: "POST", body: addrData });
      }

      toast.success("Profile updated!");
    } catch { toast.error("Failed to save profile") }
    finally { setSaving(false) }
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      <div className={cn("border-b", isDark ? "border-white/5 bg-charcoal-800" : "border-gray-200 bg-white")}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-crimson-600 text-white text-xl">{getInitials(form.full_name || "U")}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-white">{form.full_name || "Your Name"}</h2>
                <p className="text-gray-400 text-sm">{form.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-white">Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">Email</Label><Input value={form.email} disabled className="bg-white/5 text-gray-400 border-white/10" /></div>
              <div><Label className="text-white">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">Address Line 1</Label><Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">Address Line 2</Label><Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">District</Label><DistrictSelect value={form.district} onChange={(v) => setForm({ ...form, district: v })} /></div>
              <div><Label className="text-white">State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
              <div><Label className="text-white">Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="bg-white/5 text-white border-white/10" /></div>
            </div>

            <Button className="mt-6" onClick={saveProfile} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
            </Button>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gold-500" /> My Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">{o.event?.title || "Unknown Event"}</p>
                      <p className="text-gray-500 text-xs">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold-500 font-semibold">{formatPrice(o.total_amount)}</p>
                      <span className={cn("px-2 py-0.5 rounded text-xs", o.status === "paid" ? "bg-green-500/20 text-green-500" : "bg-gold-500/20 text-gold-500")}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

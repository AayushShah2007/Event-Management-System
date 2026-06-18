"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Search, Percent, Tag, X, Save, Copy, Check, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const emptyCoupon = {
  code: "", type: "percentage", value: "", min_order_amount: "0", max_discount: "", usage_limit: "0", expires_at: "",
};

export default function AdminCouponsPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...emptyCoupon });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) { console.log(e) }
    finally { setLoading(false) }
  };

  useEffect(() => { loadCoupons(); }, []);

  const filtered = coupons.filter((c) =>
    !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyCoupon });
    setShowForm(true);
  };

  const openEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      min_order_amount: String(coupon.min_order_amount || 0),
      max_discount: coupon.max_discount ? String(coupon.max_discount) : "",
      usage_limit: String(coupon.usage_limit || 0),
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error("Code and value are required"); return; }
    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: parseInt(form.usage_limit) || 0,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      if (editingId) {
        const res = await fetch(`/api/admin/coupons?id=${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Coupon updated");
      } else {
        const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
        toast.success("Coupon created");
      }
      setShowForm(false);
      loadCoupons();
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  };

  const toggleActive = async (coupon: any) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !coupon.is_active }) });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(`Coupon ${coupon.is_active ? "disabled" : "enabled"}`);
      loadCoupons();
    } catch (e: any) { toast.error(e.message) }
  };

  const toggleVisibility = async (coupon: any) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_visible: !coupon.is_visible }) });
      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(`Coupon ${coupon.is_visible ? "hidden from" : "visible to"} users`);
      loadCoupons();
    } catch (e: any) { toast.error(e.message) }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Coupon deleted");
      loadCoupons();
    } catch (e: any) { toast.error(e.message) }
  };

  const isExpired = (c: any) => c.expires_at && new Date(c.expires_at) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Discount Coupons</h1>
          <p className="text-gray-400 mt-1">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""} on platform</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="p-6 bg-charcoal-800 border-white/5 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white mb-6">{editingId ? "Edit Coupon" : "Create New Coupon"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm">Coupon Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER50"
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white font-mono uppercase"
              />
            </div>
            <div>
              <Label className="text-white text-sm">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1.5 bg-charcoal-900 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal-800 border-white/10 text-white">
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white text-sm">Value</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percentage" ? "10" : "100"}
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white text-sm">Min Order Amount (₹)</Label>
              <Input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                placeholder="0"
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white text-sm">Max Discount (₹) — for percentage type</Label>
              <Input
                type="number"
                value={form.max_discount}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                placeholder="No limit"
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white text-sm">Usage Limit (0 = unlimited)</Label>
              <Input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="0"
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-white text-sm">Expires At</Label>
              <Input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Coupon"}
            </Button>
          </div>
        </Card>
      )}

      {/* Coupon Rows */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-charcoal-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold mb-2">No coupons found</h2>
          <p className="text-gray-400">Create your first discount coupon</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((coupon, i) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all",
                !coupon.is_active ? "opacity-50 border-gray-700" :
                isExpired(coupon) ? "opacity-60 border-orange-500/30" :
                "bg-charcoal-800 border-white/5 hover:border-white/10"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  coupon.type === "percentage" ? "bg-purple-500/20" : "bg-gold-500/20"
                )}>
                  {coupon.type === "percentage" ? (
                    <Percent className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Tag className="w-4 h-4 text-gold-400" />
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn(
                      "text-base font-bold font-mono flex items-center gap-1.5",
                      !coupon.is_active ? "text-gray-500" : "text-white"
                    )}>
                      {coupon.code}
                      <button onClick={() => { navigator.clipboard.writeText(coupon.code); setCopiedId(coupon.id); setTimeout(() => setCopiedId(null), 2000); }} className="p-0.5 rounded hover:bg-white/10 text-gray-600 hover:text-gray-300">
                        {copiedId === coupon.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 min-w-0">
                    <span className="shrink-0">{coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`}</span>
                    {coupon.usage_limit > 0 && <span className="shrink-0">{coupon.used_count}/{coupon.usage_limit} used</span>}
                    {coupon.min_order_amount > 0 && <span className="shrink-0">Min ₹{coupon.min_order_amount}</span>}
                    {coupon.max_discount != null && <span className="shrink-0">Max ₹{coupon.max_discount}</span>}
                    {coupon.expires_at && (
                      <span className={cn("shrink-0", isExpired(coupon) && "text-red-400")}>
                        Exp {new Date(coupon.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => toggleActive(coupon)} className="p-1.5 rounded-lg hover:bg-white/10" title={coupon.is_active ? "Disable" : "Enable"}>
                      {coupon.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-500" />}
                    </button>
                    <button onClick={() => toggleVisibility(coupon)} className="p-1.5 rounded-lg hover:bg-white/10" title={coupon.is_visible ? "Hide from users" : "Show to users"}>
                      {coupon.is_visible ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
                    <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!coupon.is_active && <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">Disabled</span>}
                  {!coupon.is_visible && coupon.is_active && <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">Hidden</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

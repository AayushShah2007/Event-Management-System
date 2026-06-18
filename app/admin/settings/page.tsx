"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe, CreditCard, ShoppingCart, Bell, Star, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "branding", label: "Branding", icon: Palette },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { settings, updateSetting, setSettings } = useAppStore();

  const handleSave = () => {
    setSettings({ ...settings });
    toast.success("Settings saved");
  };

  const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your application settings</p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="flex flex-row lg:flex-col gap-1 lg:w-52 shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-crimson-600/20 text-crimson-400 border border-crimson-500/30"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card className="p-6 bg-charcoal-800 border-white/5">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">

              {/* General */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white">Site Name</label>
                    <Input
                      value={settings.site_name || ""}
                      onChange={(e) => updateSetting("site_name", e.target.value)}
                      placeholder="EventPass"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Support Email</label>
                    <Input
                      value={settings.support_email || ""}
                      onChange={(e) => updateSetting("support_email", e.target.value)}
                      placeholder="support@eventpass.com"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Contact Phone</label>
                    <Input
                      value={settings.contact_phone || ""}
                      onChange={(e) => updateSetting("contact_phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Footer Text</label>
                    <Input
                      value={settings.footer_text || ""}
                      onChange={(e) => updateSetting("footer_text", e.target.value)}
                      placeholder="© 2026 EventPass. All rights reserved."
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Payments */}
              {activeTab === "payments" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white">Commission / Fee (%)</label>
                    <Input
                      type="number"
                      value={settings.commission_percent ?? ""}
                      onChange={(e) => updateSetting("commission_percent", parseFloat(e.target.value) || 0)}
                      placeholder="5"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Tax Rate (%)</label>
                    <Input
                      type="number"
                      value={settings.tax_rate ?? ""}
                      onChange={(e) => updateSetting("tax_rate", parseFloat(e.target.value) || 0)}
                      placeholder="18"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Currency Symbol</label>
                    <Select
                      value={settings.currency || "INR"}
                      onValueChange={(v) => updateSetting("currency", v)}
                    >
                      <SelectTrigger className="mt-1.5 bg-charcoal-900 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal-800 border-white/10 text-white">
                        <SelectItem value="INR">₹ (INR)</SelectItem>
                        <SelectItem value="USD">$ (USD)</SelectItem>
                        <SelectItem value="EUR">€ (EUR)</SelectItem>
                        <SelectItem value="GBP">£ (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Exchange Rate (1 INR → target)</label>
                    <p className="text-xs text-gray-500 mb-2">Set conversion rate for each currency. E.g., 0.012 for USD means ₹1 = $0.012</p>
                    <div className="space-y-2">
                      {["USD", "EUR", "GBP"].map((c) => (
                        <div key={c} className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm w-10">{c}</span>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={settings.exchange_rates?.[c] ?? ""}
                            onChange={(e) => {
                              const rates = { ...(settings.exchange_rates || {}) };
                              rates[c] = parseFloat(e.target.value) || 0;
                              updateSetting("exchange_rates", rates);
                            }}
                            placeholder="e.g. 0.012"
                            className="bg-charcoal-900 border-white/10 text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white">Auto-cancel pending orders after (hours)</label>
                    <Input
                      type="number"
                      value={settings.auto_cancel_hours ?? ""}
                      onChange={(e) => updateSetting("auto_cancel_hours", parseInt(e.target.value) || 0)}
                      placeholder="24"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Max tickets per order</label>
                    <Input
                      type="number"
                      value={settings.max_tickets_per_order ?? ""}
                      onChange={(e) => updateSetting("max_tickets_per_order", parseInt(e.target.value) || 10)}
                      placeholder="10"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Default booking limit per user</label>
                    <Input
                      type="number"
                      value={settings.default_booking_limit ?? ""}
                      onChange={(e) => updateSetting("default_booking_limit", parseInt(e.target.value) || 5)}
                      placeholder="5"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === "notifications" && (
                <div className="space-y-4">
                  <SettingRow label="Email confirmations" description="Send email receipt after successful payment">
                    <Switch
                      checked={settings.email_confirmations ?? true}
                      onCheckedChange={(v) => updateSetting("email_confirmations", v)}
                    />
                  </SettingRow>
                  <SettingRow label="Require OTP for events" description="Always require email/phone verification at checkout">
                    <Switch
                      checked={settings.require_otp ?? true}
                      onCheckedChange={(v) => updateSetting("require_otp", v)}
                    />
                  </SettingRow>
                  <SettingRow label="Order status updates" description="Notify users when order status changes">
                    <Switch
                      checked={settings.order_status_updates ?? true}
                      onCheckedChange={(v) => updateSetting("order_status_updates", v)}
                    />
                  </SettingRow>
                </div>
              )}

              {/* Reviews */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  <SettingRow label="Auto-publish reviews" description="Reviews appear immediately without approval">
                    <Switch
                      checked={settings.auto_publish_reviews ?? true}
                      onCheckedChange={(v) => updateSetting("auto_publish_reviews", v)}
                    />
                  </SettingRow>
                  <SettingRow label="Require approval" description="Admins must approve reviews before they go live">
                    <Switch
                      checked={settings.review_approval_required ?? false}
                      onCheckedChange={(v) => updateSetting("review_approval_required", v)}
                    />
                  </SettingRow>
                </div>
              )}

              {/* Branding */}
              {activeTab === "branding" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white">Logo URL</label>
                    <Input
                      value={settings.logo_url || ""}
                      onChange={(e) => updateSetting("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Favicon URL</label>
                    <Input
                      value={settings.favicon_url || ""}
                      onChange={(e) => updateSetting("favicon_url", e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                      className="mt-1.5 bg-charcoal-900 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Brand Color</label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <input
                        type="color"
                        value={settings.brand_color || "#dc2626"}
                        onChange={(e) => updateSetting("brand_color", e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                      />
                      <Input
                        value={settings.brand_color || "#dc2626"}
                        onChange={(e) => updateSetting("brand_color", e.target.value)}
                        className="bg-charcoal-900 border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

            </motion.div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import DownloadReportModal from "@/components/shared/DownloadReportModal";

const statusFilters = ["all", "pending", "accepted", "paid", "completed", "rejected", "auto_rejected"];

export default function OrderHistoryPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params: Record<string, string> = { order: "created_at.desc", limit: "50" };
        if (filter !== "all") params.status = `eq.${filter}`;

        const data = await supabaseQuery("orders", {
          select: "*",
          params,
        });
        let ordersArr: any[] = data || [];

        const orderIds = ordersArr.map((o: any) => o.id).filter(Boolean);
        let itemsByOrder: Record<string, any[]> = {};
        if (orderIds.length) {
          const oiData = await supabaseQuery("order_items", {
            params: { order_id: `in.(${orderIds.join(",")})` },
            select: "*",
          }).catch(() => []) || [];
          const catIds = [...new Set(oiData.map((oi: any) => oi.category_id).filter(Boolean))];
          let catMap: Record<string, any> = {};
          if (catIds.length) {
            const catData = await supabaseQuery("event_categories", {
              select: "id,name",
              params: { id: `in.(${catIds.join(",")})` },
            }).catch(() => []) || [];
            catMap = Object.fromEntries(catData.map((c: any) => [c.id, c]));
          }
          oiData.forEach((oi: any) => {
            if (!itemsByOrder[oi.order_id]) itemsByOrder[oi.order_id] = [];
            itemsByOrder[oi.order_id].push({ ...oi, category: catMap[oi.category_id] || null });
          });
        }

        const eventIds = [...new Set(ordersArr.map((o: any) => o.event_id).filter(Boolean))];
        if (eventIds.length) {
          const evData = await supabaseQuery("events", { select: "id,title,date,venue", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
          const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
          ordersArr = ordersArr.map((o: any) => ({ ...o, event: evMap[o.event_id] || null, items: itemsByOrder[o.id] || [] }));
        }
        const userIds = [...new Set(ordersArr.map((o: any) => o.user_id).filter(Boolean))];
        if (userIds.length) {
          const adminData = await fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ users: [] }));
          const userMap = Object.fromEntries((adminData.users || []).map((u: any) => [u.id, u]));
          setOrders(ordersArr.map((o: any) => ({ ...o, user: userMap[o.user_id] || null })));
        } else {
          setOrders(ordersArr);
        }
      } catch (e) { console.log(e) }
      finally { setLoading(false) }
    };
    fetchOrders();
  }, [filter]);

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.event?.title?.toLowerCase().includes(q) ||
      o.user?.full_name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.user?.phone?.includes(q)
    );
  });

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      pending: "bg-gold-500/20 text-gold-500",
      accepted: "bg-blue-500/20 text-blue-500",
      paid: "bg-green-500/20 text-green-500",
      completed: "bg-purple-500/20 text-purple-500",
      rejected: "bg-crimson-500/20 text-crimson-500",
      auto_rejected: "bg-gray-500/20 text-gray-400",
    };
    return m[s] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Order History</h1>
          <p className="text-gray-400 mt-1">{filtered.length} orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-charcoal-800 border-white/5 text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all", filter === s ? "bg-crimson-600 text-white" : "bg-charcoal-800 text-gray-400 hover:text-white border border-white/5")}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-charcoal-800 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-charcoal-800 border-white/5">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No orders found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-charcoal-800 border-white/5 overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm items-center">
                    <div><p className="text-gray-400 text-xs">Order ID</p><p className="text-white font-mono">{order.id.slice(0, 12)}...</p></div>
                    <div><p className="text-gray-400 text-xs">Event</p><p className="text-gray-300 truncate">{order.event?.title || "Unknown"}</p></div>
                    <div><p className="text-gray-400 text-xs">Customer</p><p className="text-white">{order.user?.full_name || "Unknown"}</p></div>
                    <div><p className="text-gray-400 text-xs">Amount</p><p className="text-gold-500 font-semibold">{formatPrice(order.total_amount)}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor(order.status))}>{order.status.replace("_", " ")}</span>
                      {expanded === order.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                </div>
                {expanded === order.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-white/5">
                    <div className="p-5 grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Customer</p>
                          <p className="text-white font-medium">{order.user?.full_name || "N/A"}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{order.user?.email || "N/A"}</p>
                          <p className="text-gray-400 text-xs">{order.user?.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Delivery Address</p>
                          {order.delivery_first_name ? (
                            <>
                              <p className="text-white text-xs">{order.delivery_first_name} {order.delivery_last_name}</p>
                              <p className="text-gray-400 text-xs mt-0.5">{order.delivery_email} | {order.delivery_phone}</p>
                              <p className="text-gray-300 text-xs mt-1">{order.delivery_address_line1}</p>
                              {order.delivery_address_line2 && <p className="text-gray-300 text-xs">{order.delivery_address_line2}</p>}
                              <p className="text-gray-400 text-xs">{order.delivery_city}{order.delivery_district ? `, ${order.delivery_district}` : ""}{order.delivery_state ? `, ${order.delivery_state}` : ""} - {order.delivery_pincode}</p>
                            </>
                          ) : (
                            <p className="text-gray-500 text-xs">No address saved</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Order Details</p>
                          <p className="text-gray-300 text-xs">Date: {formatDate(order.created_at)}</p>
                          <p className="text-gold-500 font-semibold text-sm mt-1">{formatPrice(order.total_amount)}</p>
                          <span className={cn("inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium", statusColor(order.status))}>{order.status.replace("_", " ")}</span>
                        </div>
                        <div>
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Event</p>
                          <p className="text-gray-300 text-xs">{order.event?.title || "Unknown"}</p>
                          {order.event?.date && <p className="text-gray-400 text-xs mt-0.5">{formatDate(order.event.date)}</p>}
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Tickets</p>
                            <div className="flex flex-wrap gap-2">
                              {order.items.map((oi: any) => (
                                <span key={oi.id} className="px-2 py-1 rounded bg-white/5 text-gray-300 text-xs border border-white/10">
                                  {oi.category?.name || "Unknown"} × {oi.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DownloadReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Order History Report"
        filename="order-history-report"
        columns={[
          { key: "id", label: "Order ID" },
          { key: "event", label: "Event Name" },
          { key: "eventDate", label: "Event Date" },
          { key: "ticketCategory", label: "Ticket Category" },
          { key: "quantity", label: "Quantity" },
          { key: "ticketPrice", label: "Ticket Price" },
          { key: "customerName", label: "Customer Name" },
          { key: "orderAmount", label: "Order Amount" },
          { key: "status", label: "Status" },
          { key: "deliveryName", label: "Delivery Name" },
          { key: "deliveryPhone", label: "Delivery Phone" },
          { key: "deliveryEmail", label: "Delivery Email" },
          { key: "addressLine1", label: "Address Line 1" },
          { key: "addressLine2", label: "Address Line 2" },
          { key: "city", label: "City" },
          { key: "district", label: "District" },
          { key: "state", label: "State" },
          { key: "pincode", label: "Pincode" },
          { key: "bookingDate", label: "Booking Date" },
        ]}
        data={filtered.map((o) => ({
          id: o.id,
          event: o.events?.title || "-",
          eventDate: o.events?.date || "-",
          ticketCategory: o.selected_ticket_type || "-",
          quantity: o.quantity || "-",
          ticketPrice: formatPrice(o.total_amount ? Math.round(o.total_amount / o.quantity) : 0),
          customerName: o.user_name || "-",
          orderAmount: formatPrice(o.total_amount || 0),
          status: o.status || "-",
          deliveryName: `${o.delivery_first_name || ""} ${o.delivery_last_name || ""}`.trim() || "-",
          deliveryPhone: o.delivery_phone || "-",
          deliveryEmail: o.delivery_email || "-",
          addressLine1: o.delivery_address_line1 || "-",
          addressLine2: o.delivery_address_line2 || "-",
          city: o.delivery_city || "-",
          district: o.delivery_district || "-",
          state: o.delivery_state || "-",
          pincode: o.delivery_pincode || "-",
          bookingDate: formatDate(o.created_at),
        }))}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatPrice, formatDate, cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-gold-500/20 text-gold-500",
  accepted: "bg-blue-500/20 text-blue-500",
  paid: "bg-green-500/20 text-green-500",
  completed: "bg-purple-500/20 text-purple-500",
  rejected: "bg-crimson-500/20 text-crimson-500",
  auto_rejected: "bg-gray-500/20 text-gray-400",
};

export default function OrdersPage() {
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchOrders = async () => {
      try {
        const orderData = await supabaseQuery("orders", {
          params: { user_id: `eq.${user.id}`, order: "created_at.desc", limit: "50" },
          select: "*",
        });
        let items = orderData || [];

        const orderIds = items.map((o: any) => o.id).filter(Boolean);
        let itemsMap: Record<string, any[]> = {};
        if (orderIds.length) {
          const orderItemsData = await supabaseQuery("order_items", {
            params: { order_id: `in.(${orderIds.join(",")})` },
            select: "*",
          }).catch(() => []);
          const catIds = [...new Set((orderItemsData || []).map((oi: any) => oi.category_id).filter(Boolean))];
          let catMap: Record<string, any> = {};
          if (catIds.length) {
            const catData = await supabaseQuery("event_categories", {
              select: "id,name,price",
              params: { id: `in.(${catIds.join(",")})` },
            }).catch(() => []);
            catMap = Object.fromEntries((catData || []).map((c: any) => [c.id, c]));
          }
          (orderItemsData || []).forEach((oi: any) => {
            if (!itemsMap[oi.order_id]) itemsMap[oi.order_id] = [];
            itemsMap[oi.order_id].push({ ...oi, category: catMap[oi.category_id] || null });
          });
        }

        const eventIds = [...new Set(items.map((o: any) => o.event_id).filter(Boolean))];
        if (eventIds.length) {
          const evData = await supabaseQuery("events", { select: "id,title,thumbnail_url,date,time,venue", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
          const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
          items = items.map((o: any) => ({ ...o, event: evMap[o.event_id] || null, items: itemsMap[o.id] || [] }));
        }
        setOrders(items);
      } catch (err) {
        console.log("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-900">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to view orders</h1>
          <p className="text-gray-400 mb-6">Please sign in to see your order history</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="text-gray-400 mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-charcoal-800 rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">Start by booking an event</p>
            <Link href="/events"><Button>Browse Events</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={cn("p-5", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                  <div className="flex items-start gap-4">
                    {order.event?.thumbnail_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-charcoal-900">
                        <img src={order.event.thumbnail_url} alt={order.event.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white font-semibold">{order.event?.title || "Unknown Event"}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{order.event?.venue}</p>
                          {order.event?.date && (() => {
                            const diff = Math.ceil((new Date(order.event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (diff > 0) return <span className="text-xs text-gold-500">Upcoming event in {diff} day{diff > 1 ? "s" : ""}</span>;
                            return <span className="text-xs text-crimson-500">Tickets for this event has been expired</span>;
                          })()}
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium shrink-0", statusColors[order.status] || "bg-gray-500/20 text-gray-400")}>
                          {order.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                          <div><span className="text-gray-500">Order ID:</span> <span className="text-white font-mono text-xs">{order.id.slice(0, 8)}...</span></div>
                          <div><span className="text-gray-500">Amount:</span> <span className="text-gold-500 font-semibold">{formatPrice(order.total_amount)}</span></div>
                          <div className="col-span-2"><span className="text-gray-500">Ordered:</span> <span className="text-gray-400">{formatDate(order.created_at)}</span></div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div>
                            <span className="text-gray-500 text-xs block mb-1">Tickets:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.map((oi: any, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-white text-xs border border-white/10">
                                  {oi.category?.name || "Unknown"} × {oi.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {order.delivery_first_name && (
                          <div className="border-t border-white/5 pt-2 mt-2 space-y-1">
                            <span className="text-gray-500 text-xs block mb-0.5">Delivery Address:</span>
                            <p className="text-white text-xs leading-relaxed">
                              {order.delivery_first_name} {order.delivery_last_name}
                            </p>
                            <p className="text-white text-xs leading-relaxed">{order.delivery_email} | {order.delivery_phone}</p>
                            <p className="text-white text-xs leading-relaxed">{order.delivery_address_line1}</p>
                            {order.delivery_address_line2 && <p className="text-white text-xs leading-relaxed">{order.delivery_address_line2}</p>}
                            <p className="text-white text-xs leading-relaxed">{order.delivery_city}{order.delivery_district ? `, ${order.delivery_district}` : ""}{order.delivery_state ? `, ${order.delivery_state}` : ""} - {order.delivery_pincode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

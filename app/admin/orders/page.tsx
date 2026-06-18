"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Check, X, Clock, Bell, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export default function AdminOrdersPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

const playNotificationSound = () => {
  if (audioRef.current) {
    audioRef.current.play().catch(() => {});
  }
};

  const prevCountRef = useRef(0);

  const fetchPendingOrders = useCallback(async (notify = false) => {
    try {
      const data = await supabaseQuery("orders", {
        params: { status: "eq.pending", order: "created_at.desc" },
        select: "*",
      });
      let newOrders = data || [];

      const orderIds = newOrders.map((o: any) => o.id).filter(Boolean);
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

      const eventIds = [...new Set(newOrders.map((o: any) => o.event_id).filter(Boolean))];
      if (eventIds.length) {
        const evData = await supabaseQuery("events", { select: "id,title,image_url,date,time,venue", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
        const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
        newOrders = newOrders.map((o: any) => ({ ...o, event: evMap[o.event_id] || null, items: itemsByOrder[o.id] || [] }));
      }
      const userIds = [...new Set(newOrders.map((o: any) => o.user_id).filter(Boolean))];
      if (userIds.length) {
        const adminData = await fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ users: [] }));
        const userMap = Object.fromEntries((adminData.users || []).map((u: any) => [u.id, u]));
        newOrders.forEach((o: any) => { o.user = userMap[o.user_id] || null; });
      }

      if (notify && prevCountRef.current > 0 && newOrders.length > prevCountRef.current) {
        playNotificationSound();
        toast.custom((t) => (
          <div className="bg-crimson-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Bell className="w-4 h-4" />
            New order received!
          </div>
        ));
      }

      prevCountRef.current = newOrders.length;
      setOrders(newOrders);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();

    const interval = setInterval(() => fetchPendingOrders(true), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchPendingOrders]);

  const handleAccept = async (orderId: string) => {
    try {
      await supabaseQuery(`orders?id=eq.${orderId}`, {
        method: "PATCH",
        body: { status: "accepted" },
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Order accepted!");
    } catch (error) {
      console.error("Error accepting order:", error);
      toast.error("Failed to accept order");
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await supabaseQuery(`orders?id=eq.${orderId}`, {
        method: "PATCH",
        body: { status: "rejected" },
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.error("Order rejected");
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error("Failed to reject order");
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">New Orders</h1>
          <p className="text-gray-400 mt-1">{orders.length} pending orders</p>
        </div>
        <div className="flex items-center gap-2 text-gold-500">
          <Bell className="w-5 h-5" />
          <span className="text-sm">Real-time updates enabled</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 bg-charcoal-800 border-white/5">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-white/10 rounded-lg" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className={cn("p-12 text-center", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Pending Orders</h2>
          <p className="text-gray-400">New orders will appear here in real-time</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={cn(
                "overflow-hidden relative",
                isDark ? "bg-charcoal-800 border-white/5" : "bg-white"
              )}>
                {/* Status gradient accent bar */}
                <div className="h-1 bg-gradient-to-r from-gold-500 via-amber-500 to-gold-300" />
                {/* Glow overlay */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {/* Event Image */}
                <div className="relative h-40">
            <Image
              src={order.event?.thumbnail_url || order.event?.image_url || "/placeholder.jpg"}
              alt={order.event?.title || "Event"}
              fill
              sizes="100vw"
              className="object-cover"
            />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 rounded bg-gold-500 text-charcoal-900 text-xs font-semibold">
                      Pending
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">
                    {order.event?.title || "Unknown Event"}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-400">
                      <span className="text-gray-500">Customer:</span>{" "}
                      {order.user?.full_name || "Unknown"}
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Email:</span>{" "}
                      {order.user?.email || "N/A"}
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Phone:</span>{" "}
                      {order.user?.phone || "N/A"}
                    </p>
                  </div>

                  {/* Tickets */}
                  <div className="mt-4 p-3 rounded-lg bg-white/5">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          {item.category?.name} x {item.quantity}
                        </span>
                        <span className="text-white">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-gold-500 font-bold">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => handleAccept(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleReject(order.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Ordered on {formatDate(order.created_at)}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

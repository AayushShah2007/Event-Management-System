"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Order, Event } from "@/types";
import { formatPrice, cn, calculateTimeRemaining } from "@/lib/utils";
import toast from "react-hot-toast";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

export const dynamic = "force-dynamic";

const ORDER_TIMEOUT = 120; // 2 minutes

export default function CheckoutApprovalPage() {
  const router = useRouter();
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";

  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push("/");
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order"));
  }, [user, router]);

  if (!user || !orderId) return null;

  return <CheckoutApprovalContent orderId={orderId} />;
}

function CheckoutApprovalContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";

  const [order, setOrder] = useState<Order | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected" | "timeout">("pending");
  const [timeLeft, setTimeLeft] = useState(ORDER_TIMEOUT);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await supabaseQuery(`orders?id=eq.${orderId}`, {
          select: "*,event:events(*),items:order_items(*)",
        });
        const orderData = Array.isArray(data) ? data[0] : data;
        if (!orderData) throw new Error("Order not found");
        setOrder(orderData);
        setEvent(orderData.event);
      } catch (error) {
        console.error("Error fetching order:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, router]);

  // Countdown timer
  useEffect(() => {
    if (status !== "pending") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("timeout");
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Poll for order status changes
  useEffect(() => {
    if (!orderId || status !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const data = await supabaseQuery(`orders?id=eq.${orderId}`, { select: "status" });
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return;
        const newStatus = row.status;
        if (newStatus === "accepted") {
          clearInterval(interval);
          setStatus("accepted");
          toast.success("Order accepted! Redirecting to payment...");
          setTimeout(() => {
            router.push(`/checkout/payment?order=${orderId}`);
          }, 2000);
        } else if (newStatus === "rejected" || newStatus === "auto_rejected") {
          clearInterval(interval);
          setStatus("rejected");
          toast.error("Order was rejected.");
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, router, status]);

  const handleTimeout = async () => {
    try {
      await supabaseQuery(`orders?id=eq.${orderId}`, {
        method: "PATCH",
        body: { status: "auto_rejected" },
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      <div className="pt-8"><CheckoutSteps current={2} /></div>
      <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className={cn("p-8 text-center", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={cn(
              "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
              status === "pending" && "bg-gold-500/20",
              status === "accepted" && "bg-green-500/20",
              status === "rejected" && "bg-crimson-500/20",
              status === "timeout" && "bg-orange-500/20"
            )}
          >
            {status === "pending" && (
              <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
            )}
            {status === "accepted" && (
              <CheckCircle className="w-12 h-12 text-green-500" />
            )}
            {status === "rejected" && (
              <XCircle className="w-12 h-12 text-crimson-500" />
            )}
            {status === "timeout" && (
              <AlertCircle className="w-12 h-12 text-orange-500" />
            )}
          </motion.div>

          {/* Status Title */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {status === "pending" && "Processing Your Order"}
            {status === "accepted" && "Order Accepted!"}
            {status === "rejected" && "Order Rejected"}
            {status === "timeout" && "Order Timed Out"}
          </h1>

          {/* Status Description */}
          <p className="text-gray-400 mb-6">
            {status === "pending" && "Please wait while we verify your order."}
            {status === "accepted" && "Your order has been approved! Redirecting to payment..."}
            {status === "rejected" && "Your order was rejected. Please try again or contact support."}
            {status === "timeout" && "Your order was auto-rejected due to technical issues. Please try again."}
          </p>

          {/* Countdown Timer */}
          {status === "pending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-4xl font-bold text-gold-500">
                <Clock className="w-8 h-8" />
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
            </motion.div>
          )}

          {/* Order Details */}
          {event && order && (
            <div className={cn("rounded-lg p-4 mb-6", isDark ? "bg-white/5" : "bg-gray-50")}>
              <p className="text-white font-semibold mb-1">{event.title}</p>
              <p className="text-gray-400 text-sm mb-2">{event.venue}</p>
              <p className="text-gold-500 font-bold text-xl">
                {formatPrice(order.total_amount)}
              </p>
            </div>
          )}

          {/* Action Button */}
          {(status === "rejected" || status === "timeout") && (
            <Button
              className="w-full"
              onClick={() => router.push("/")}
            >
              Try Again
            </Button>
          )}

          {status === "accepted" && (
            <Button
              className="w-full"
              onClick={() => router.push(`/checkout/payment?order=${orderId}`)}
            >
              Proceed to Payment
            </Button>
          )}
        </Card>
      </motion.div>
      </div>
    </div>
  );
}
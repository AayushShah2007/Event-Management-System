"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, Users, Ticket, Calendar, ShoppingCart, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { supabaseQuery, supabaseCount } from "@/lib/supabase-rest";
import { formatPrice, formatNumber, cn } from "@/lib/utils";
import Link from "next/link";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalEvents: number;
  totalUsers: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

function useAnimatedNumber(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    prev.current = 0;
    setCurrent(0);
    if (target === 0) return;
    const startTime = performance.now();
    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return current;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-gold-500/20 text-gold-500 border-gold-500/30",
    accepted: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    paid: "bg-green-500/20 text-green-500 border-green-500/30",
    rejected: "bg-crimson-500/20 text-crimson-500 border-crimson-500/30",
    completed: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    auto_rejected: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", colors[status] || "bg-gray-500/20 text-gray-400")}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function AdminDashboard() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalRevenue: 0, totalEvents: 0, totalUsers: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStr = todayStart.toISOString();

        let ordersCount = 0, pendingCount = 0, eventsCount = 0, usersCount = 0;
        try {
          const counts = await Promise.all([
            supabaseCount("orders"),
            supabaseCount("orders", { status: "eq.pending" }),
            supabaseCount("events", { is_live: "eq.true" }),
            fetch("/api/admin/users").then((r) => r.json()).then((d) => d.count).catch(() => 0),
          ]);
          ordersCount = counts[0]; pendingCount = counts[1]; eventsCount = counts[2]; usersCount = counts[3];
        } catch (e: any) { setError(`Count queries failed: ${e.message}`); setLoading(false); return; }

      let totalRevenue = 0;
      let todayOrders = 0;
      let todayRevenue = 0;
      let recentOrdersArr: any[] = [];

      try {
        const revenueData = await supabaseQuery("orders", {
          select: "total_amount,created_at",
          params: { status: "in.(paid,completed,accepted)", order: "created_at.desc", limit: "1000" },
        });
        const revArr = revenueData || [];
        totalRevenue = revArr.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        todayOrders = revArr.filter((o: any) => o.created_at >= todayStr).length;
        todayRevenue = revArr.filter((o: any) => o.created_at >= todayStr).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      } catch (e) { setError(`Revenue query failed: ${e}`); setLoading(false); return; }

      try {
        const data = await supabaseQuery("orders", {
          select: "*",
          params: { order: "created_at.desc", limit: "5" },
        });
        recentOrdersArr = data || [];
        const eventIds = [...new Set(recentOrdersArr.map((o: any) => o.event_id).filter(Boolean))];
        if (eventIds.length) {
          const evData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
          const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
          recentOrdersArr = recentOrdersArr.map((o: any) => ({ ...o, event: evMap[o.event_id] || null }));
        }
        const userIds = [...new Set(recentOrdersArr.map((o: any) => o.user_id).filter(Boolean))];
        if (userIds.length) {
          const adminData = await fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ users: [] }));
          const userMap = Object.fromEntries((adminData.users || []).map((u: any) => [u.id, u]));
          recentOrdersArr = recentOrdersArr.map((o: any) => ({ ...o, user: userMap[o.user_id] || null }));
        }
      } catch (e) { setError(`Recent orders query failed: ${e}`); setLoading(false); return; }

      setStats({
        totalOrders: ordersCount, totalRevenue, totalEvents: eventsCount, totalUsers: usersCount,
        pendingOrders: pendingCount, todayOrders, todayRevenue,
      });
      setRecentOrders(recentOrdersArr);
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const animRevenue = useAnimatedNumber(stats.totalRevenue);
  const animOrders = useAnimatedNumber(stats.totalOrders);
  const animEvents = useAnimatedNumber(stats.totalEvents);
  const animUsers = useAnimatedNumber(stats.totalUsers);
  const animTodayRev = useAnimatedNumber(stats.todayRevenue);
  const animTodayOrd = useAnimatedNumber(stats.todayOrders);

  const statCards = [
    {
      title: "Total Revenue",
      rawValue: stats.totalRevenue,
      displayValue: animRevenue,
      icon: DollarSign,
      trend: "+12%",
      trendUp: true,
      color: "text-green-500",
      iconBg: "bg-green-500/20",
    },
    {
      title: "Total Orders",
      rawValue: stats.totalOrders,
      displayValue: animOrders,
      icon: ShoppingCart,
      trend: "+8%",
      trendUp: true,
      color: "text-crimson-500",
      iconBg: "bg-crimson-500/20",
    },
    {
      title: "Live Events",
      rawValue: stats.totalEvents,
      displayValue: animEvents,
      icon: Calendar,
      trend: "+2",
      trendUp: true,
      color: "text-gold-500",
      iconBg: "bg-gold-500/20",
    },
    {
      title: "Total Users",
      rawValue: stats.totalUsers,
      displayValue: animUsers,
      icon: Users,
      trend: "+15%",
      trendUp: true,
      color: "text-purple-500",
      iconBg: "bg-purple-500/20",
    },
  ];

  const rowAccentColors: Record<string, string> = {
    pending: "border-l-gold-500",
    accepted: "border-l-blue-500",
    paid: "border-l-green-500",
    rejected: "border-l-crimson-500",
    completed: "border-l-purple-500",
    auto_rejected: "border-l-gray-500",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold text-white">Dashboard</h1><p className="text-gray-400 mt-1">Loading...</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-charcoal-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="p-6 rounded-xl bg-crimson-500/10 border border-crimson-500/30">
          <p className="text-crimson-500 font-semibold mb-2">Supabase Query Error</p>
          <pre className="text-red-300 text-sm whitespace-pre-wrap font-mono">{error}</pre>
          <p className="text-gray-400 text-sm mt-4">Check browser console (F12) for more details. Make sure your Supabase RLS policies allow anon key SELECT access on all tables.</p>
          <p className="text-gray-400 text-sm mt-2">Try running the SQL below in Supabase SQL Editor:</p>
          <pre className="text-green-300 text-sm whitespace-pre-wrap font-mono mt-2 bg-charcoal-900 p-3 rounded-lg">
{`-- Grant anon key SELECT on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select" ON public.orders;
CREATE POLICY "anon_select" ON public.orders FOR SELECT USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select" ON public.events;
CREATE POLICY "anon_select" ON public.events FOR SELECT USING (true);

ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select" ON public.event_categories;
CREATE POLICY "anon_select" ON public.event_categories FOR SELECT USING (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select" ON public.order_items;
CREATE POLICY "anon_select" ON public.order_items FOR SELECT USING (true);`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Welcome back! Here&apos;s your overview.</p>
        </div>
        <Link href="/admin/orders" className="w-full sm:w-auto">
          <Button className={cn("w-full sm:w-auto", stats.pendingOrders > 0 ? "animate-pulse" : "")}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {stats.pendingOrders} New Orders
          </Button>
        </Link>
      </div>

      {/* Today's Mini-KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-charcoal-800 border-white/5 flex items-center gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-green-500/20">
            <Zap className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Today&apos;s Revenue</p>
            <p className="text-xl font-bold text-white">{formatPrice(animTodayRev)}</p>
          </div>
        </Card>
        <Card className="p-4 bg-charcoal-800 border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-crimson-500/20">
            <Clock className="w-5 h-5 text-crimson-500" />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Orders Today</p>
            <p className="text-xl font-bold text-white">{animTodayOrd}</p>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "p-4 sm:p-6 relative overflow-hidden group hover:border-white/20 transition-all",
              isDark ? "bg-charcoal-800 border-white/5" : "bg-white"
            )}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2 font-mono tracking-tight">
                    {stat.title === "Total Revenue" ? formatPrice(stat.displayValue) : 
                     stat.title === "Total Orders" || stat.title === "Total Users" ? formatNumber(stat.displayValue) :
                     stat.displayValue.toLocaleString()}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.iconBg, "group-hover:scale-110 transition-transform")}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {stat.trendUp ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-crimson-500" />
                )}
                <span className="text-sm text-green-500">{stat.trend}</span>
                <span className="text-sm text-gray-400">vs last month</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className={cn("p-4 sm:p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <Link href="/admin/history">
            <Button variant="ghost" size="sm" className="text-white hover:text-gold-500">View All</Button>
          </Link>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Order ID</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-[10px] sm:text-xs uppercase tracking-wider hidden sm:table-cell">Event</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Amount</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-gray-400 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "border-b border-white/5 transition-all",
                    "hover:bg-white/[0.03] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]",
                    "border-l-2",
                    rowAccentColors[order.status] || "border-l-transparent"
                  )}
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-white font-mono text-xs sm:text-sm">
                    <span className="bg-charcoal-900 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">{order.id.slice(0, 8)}...</span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4">
                    <span className="text-white text-xs sm:text-sm font-medium">{order.user?.full_name || "Unknown"}</span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-300 text-xs sm:text-sm hidden sm:table-cell">
                    {order.event?.title || "Unknown"}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-gold-500 font-semibold text-xs sm:text-sm">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 align-middle text-center">
                    <StatusBadge status={order.status} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Link href="/admin/events">
          <Card className={cn(
            "p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden",
            isDark ? "bg-charcoal-800 border-white/5 hover:border-crimson-500/40" : "bg-white"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-crimson-500/10 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-lg bg-crimson-500/20 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-crimson-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Manage Events</h3>
                <p className="text-gray-400 text-sm">Create, edit, or delete events</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className={cn(
            "p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden",
            isDark ? "bg-charcoal-800 border-white/5 hover:border-gold-500/40" : "bg-white"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-500/10 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-gold-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">User Analytics</h3>
                <p className="text-gray-400 text-sm">View detailed user insights</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/earnings">
          <Card className={cn(
            "p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden",
            isDark ? "bg-charcoal-800 border-white/5 hover:border-purple-500/40" : "bg-white"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Earnings Report</h3>
                <p className="text-gray-400 text-sm">View revenue analytics</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
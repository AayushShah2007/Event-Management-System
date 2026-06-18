"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Ticket, XCircle, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { supabaseQuery, supabaseCount } from "@/lib/supabase-rest";
import { formatPrice, formatNumber, cn } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, CartesianGrid } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  paid: "#22c55e", completed: "#8b5cf6", pending: "#f59e0b", rejected: "#ef4444", auto_rejected: "#6b7280", accepted: "#3b82f6",
};

const VIBRANT_COLORS = [
  "#dc2626", "#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#a855f7",
  "#e11d48", "#0ea5e9", "#84cc16", "#d946ef", "#10b981",
];

export default function AdminEarningsPage() {
  const { theme } = useAppStore();
  const { settings } = useAppStore();
  const curr = settings.currency || "INR";
  const rate = curr !== "INR" ? settings.exchange_rates?.[curr] : undefined;
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidOrders, setPaidOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  const [rejectedAmount, setRejectedAmount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([]);
  const [eventsRevenue, setEventsRevenue] = useState<{ name: string; revenue: number; orders: number }[]>([]);
  const [eventCategoryMap, setEventCategoryMap] = useState<Record<string, { title: string; revenue: number; categories: { name: string; revenue: number; color: string }[] }>>({});
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState(0);
  const [orderTrend, setOrderTrend] = useState(0);
  const [aovTrend, setAovTrend] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [totalOrders, paidCount, rejectedCount] = await Promise.all([
          supabaseCount("orders").catch(() => 0),
          supabaseCount("orders", { status: "in.(paid,completed)" }).catch(() => 0),
          supabaseCount("orders", { status: "in.(rejected,auto_rejected)" }).catch(() => 0),
        ]);

        const allPaidOrders = await supabaseQuery("orders", {
          select: "*",
          params: { status: "in.(paid,completed)", order: "created_at.desc", limit: "1000" },
        }).catch(() => []);
        let paidArr = Array.isArray(allPaidOrders) ? allPaidOrders : [];
        const paidEventIds = [...new Set(paidArr.map((o: any) => o.event_id).filter(Boolean))];
        if (paidEventIds.length) {
          const evData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${paidEventIds.join(",")})` } }).catch(() => []);
          const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
          paidArr = paidArr.map((o: any) => ({ ...o, event: evMap[o.event_id] || null }));
        }
        const revenue = paidArr.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);

        const rejectedOrders = await supabaseQuery("orders", {
          select: "total_amount",
          params: { status: "in.(rejected,auto_rejected)", limit: "1000" },
        }).catch(() => []);
        const rejectedArr = Array.isArray(rejectedOrders) ? rejectedOrders : [];
        const rejectedTotal = rejectedArr.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);

        // Revenue by event
        const eventMap = new Map<string, { revenue: number; orders: number }>();
        for (const o of paidArr) {
          const name = o.event?.title || "Unknown";
          const cur = eventMap.get(name) || { revenue: 0, orders: 0 };
          cur.revenue += o.total_amount || 0;
          cur.orders += 1;
          eventMap.set(name, cur);
        }
        const eventsRev = [...eventMap.entries()]
          .map(([name, v]) => ({ name, revenue: v.revenue, orders: v.orders }))
          .sort((a, b) => b.revenue - a.revenue);

        // Revenue by status
        const statusCounts: Record<string, { value: number; color: string }> = {};
        for (const s of ["paid", "completed", "pending", "rejected", "auto_rejected", "accepted"]) {
          const count = await supabaseCount("orders", { status: `eq.${s}` }).catch(() => 0);
          if (count > 0) statusCounts[s] = { value: count, color: STATUS_COLORS[s] };
        }
        const statusChart = Object.entries(statusCounts).map(([name, v]) => ({ name, ...v }));

        // Per-event category revenue from order_items
        const eventIdToTitle = new Map<string, string>();
        const orderToEvent = new Map<string, { title: string; event_id: string }>();
        for (const o of paidArr) {
          const t = o.event?.title || "Unknown";
          orderToEvent.set(o.id, { title: t, event_id: o.event_id });
          if (o.event_id) eventIdToTitle.set(o.event_id, t);
        }
        const eventCatRaw: Record<string, { title: string; revenue: number; categories: Map<string, { revenue: number; color: string }> }> = {};
        try {
          const items = await supabaseQuery("order_items", {
            select: "*",
            params: { limit: "1000" },
          }).catch(() => []);
          const itemsArr = Array.isArray(items) ? items : [];
          const catIds = [...new Set(itemsArr.map((i: any) => i.category_id).filter(Boolean))];
          let catMap = new Map<string, any>();
          if (catIds.length) {
            const catData = await supabaseQuery("event_categories", { select: "id,name,color,event_id", params: { id: `in.(${catIds.join(",")})` } }).catch(() => []);
            const catEventIds = [...new Set((catData || []).map((c: any) => c.event_id).filter(Boolean))];
            let catEvMap = new Map<string, any>();
            if (catEventIds.length) {
              const catEvData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${catEventIds.join(",")})` } }).catch(() => []);
              catEvMap = new Map((catEvData || []).map((e: any) => [e.id, e]));
            }
            for (const c of catData || []) {
              catMap.set(c.id, { ...c, event: catEvMap.get(c.event_id) || null });
            }
          }
          for (const item of itemsArr) {
            const ev = orderToEvent.get(item.order_id);
            const cat = catMap.get(item.category_id);
            const eventId = ev?.event_id || cat?.event_id || "unknown";
            const eventTitle = ev?.title || cat?.event?.title || eventIdToTitle.get(eventId) || "Unknown";
            if (!eventCatRaw[eventId]) eventCatRaw[eventId] = { title: eventTitle, revenue: 0, categories: new Map() };
            const evData = eventCatRaw[eventId];
            evData.revenue += (item.price || 0) * (item.quantity || 1);
            const catName = cat?.name || "Unknown";
            const cur = evData.categories.get(catName) || { revenue: 0, color: cat?.color || "#6b7280" };
            cur.revenue += (item.price || 0) * (item.quantity || 1);
            evData.categories.set(catName, cur);
          }
        } catch (e) { console.error("Category revenue fetch failed:", e) }
        const eventCatEntries = Object.entries(eventCatRaw)
          .map(([id, v]) => [id, { title: v.title, revenue: v.revenue, categories: [...v.categories.entries()].map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue) }] as const)
          .sort((a, b) => b[1].revenue - a[1].revenue);
        const eventCategoryMapData = Object.fromEntries(eventCatEntries);

        // Daily revenue for charts (last 30 days)
        const now = new Date();
        const dailyMap = new Map<string, { revenue: number; orders: number }>();
        for (let i = 0; i < 30; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          dailyMap.set(key, { revenue: 0, orders: 0 });
        }
        for (const o of paidArr) {
          const day = o.created_at?.split("T")[0];
          if (day && dailyMap.has(day)) {
            const cur = dailyMap.get(day)!;
            cur.revenue += o.total_amount || 0;
            cur.orders += 1;
          }
        }
        const daily = [...dailyMap.entries()]
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Current month projection
        const currMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const monthRevenue = paidArr
          .filter((o: any) => o.created_at >= currMonthStart)
          .reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const daysPassed = now.getDate();
        const monthProjection = daysPassed > 0 ? Math.round((monthRevenue / daysPassed) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) : 0;

        // Trend computation: split paid orders into two equal halves by time
        const sortedPaid = [...paidArr].sort((a: any, b: any) => (a.created_at || "").localeCompare(b.created_at || ""));
        const mid = Math.floor(sortedPaid.length / 2);
        const recentHalf = sortedPaid.slice(mid);
        const prevHalf = sortedPaid.slice(0, mid);
        const recentRev = recentHalf.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const prevRev = prevHalf.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
        const recentCount = recentHalf.length;
        const prevCount = prevHalf.length;
        setRevenueTrend(prevRev > 0 ? Math.round(((recentRev - prevRev) / prevRev) * 100) : 0);
        setOrderTrend(prevCount > 0 ? Math.round(((recentCount - prevCount) / prevCount) * 100) : 0);
        const recentAov = recentCount > 0 ? recentRev / recentCount : 0;
        const prevAov = prevCount > 0 ? prevRev / prevCount : 0;
        setAovTrend(prevAov > 0 ? Math.round(((recentAov - prevAov) / prevAov) * 100) : 0);

        setTotalRevenue(revenue);
        setPaidOrders(paidCount);
        setAvgOrderValue(paidCount > 0 ? Math.round(revenue / paidCount) : 0);
        setProjectedRevenue(monthProjection);
        setRejectedAmount(rejectedTotal);
        setDailyRevenue(daily);
        setEventsRevenue(eventsRev.slice(0, 10));
        setEventCategoryMap(eventCategoryMapData);
        setStatusData(statusChart);
        setRecentPayments(paidArr.slice(0, 20));
      } catch (e) { console.log(e) }
      finally { setLoading(false) }
    };
    fetchAll();
  }, []);

  const filteredDaily = dailyRevenue.filter((_, i) => i >= dailyRevenue.length - timeRange);

  const formatTooltip = (value: number) => [`₹${value.toLocaleString()}`, ""];

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-white text-xs">{payload[0].name}</p>
        <p className="text-white text-sm font-semibold">{typeof payload[0].value === "number" ? formatPrice(payload[0].value, curr, rate) : payload[0].value}</p>
      </div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color, sub, trend }: any) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
      <Card className="relative p-5 bg-charcoal-800 border-white/5 hover:border-white/10 transition-all overflow-hidden flex flex-col h-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex-1 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white tracking-tight">{typeof value === "string" ? value : formatPrice(value, curr, rate)}</p>
            {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", color)}>{Icon && <Icon className="w-5 h-5" />}</div>
        </div>
        <div className="h-5 flex items-center">
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1 text-xs", trend >= 0 ? "text-green-500" : "text-red-500")}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-white">Earnings</h1><p className="text-gray-400 mt-1">Loading financial data...</p></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-charcoal-800 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-charcoal-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold text-white">Earnings</h1>
        <p className="text-gray-400 mt-1">Complete financial overview & analytics</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={totalRevenue} icon={DollarSign} color="bg-gold-500/20 text-gold-500" sub="All time earnings" trend={revenueTrend} />
        <StatCard title="Average Order Value" value={avgOrderValue} icon={TrendingUp} color="bg-purple-500/20 text-purple-500" sub={`Across ${paidOrders} paid orders`} trend={aovTrend} />
        <StatCard title="Paid Orders" value={`${formatNumber(paidOrders)}`} icon={Ticket} color="bg-green-500/20 text-green-500" sub="Completed transactions" trend={orderTrend} />
        <StatCard title="Projected Revenue" value={projectedRevenue} icon={BarChart3} color="bg-gradient-to-br from-crimson-500/20 to-purple-500/20 text-crimson-500" sub="This month's pace" trend={projectedRevenue > 0 ? revenueTrend : 0} />
      </div>

      {/* Commission Info */}
      {(settings.commission_percent || settings.tax_rate) && (
        <Card className="p-4 bg-charcoal-800 border-white/5">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {settings.commission_percent ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Commission:</span>
                <span className="text-gold-500 font-semibold">{settings.commission_percent}%</span>
                <span className="text-gray-500 text-xs">({formatPrice(totalRevenue * (settings.commission_percent / 100), curr, rate)})</span>
              </div>
            ) : null}
            {settings.tax_rate ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Tax Rate:</span>
                <span className="text-white font-semibold">{settings.tax_rate}%</span>
              </div>
            ) : null}
            <span className="text-gray-500 text-xs ml-auto">Configured in Settings</span>
          </div>
        </Card>
      )}

      {/* Revenue Over Time + Daily Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 bg-charcoal-800 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Revenue Over Time</h2>
              <div className="flex gap-1 bg-charcoal-900 rounded-lg p-0.5">
                <button onClick={() => setTimeRange(7)} className={cn("px-3 py-1 text-xs rounded-md transition-all", timeRange === 7 ? "bg-crimson-600 text-white" : "text-gray-400 hover:text-white")}>7D</button>
                <button onClick={() => setTimeRange(30)} className={cn("px-3 py-1 text-xs rounded-md transition-all", timeRange === 30 ? "bg-crimson-600 text-white" : "text-gray-400 hover:text-white")}>30D</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={filteredDaily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#dc2626" stopOpacity={0.3}/><stop offset="100%" stopColor="#dc2626" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={formatTooltip} />
                <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#dc2626" }} fill="url(#revGrad)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 bg-charcoal-800 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Daily Sales Count</h2>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredDaily} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => [v, "Orders"]} />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Revenue by Event + Category Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex">
          <Card className="p-5 bg-charcoal-800 border-white/5 flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Revenue by Event</h2>
              <BarChart3 className="w-4 h-4 text-gray-400" />
            </div>
            {eventsRevenue.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                {eventsRevenue.map((e, i) => {
                  const maxRev = eventsRevenue[0].revenue || 1;
                  const pct = (e.revenue / maxRev) * 100;
                  return (
                    <div key={e.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-white truncate">{e.name}</span>
                          <span className="text-gold-500 font-medium shrink-0 ml-2">{formatPrice(e.revenue, curr, rate)}</span>
                        </div>
                        <div className="h-2.5 bg-charcoal-900 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-crimson-600 to-gold-500 rounded-full" transition={{ duration: 0.8, delay: i * 0.05 }} />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 w-10 text-right shrink-0">{e.orders} ord</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex">
          <Card className="p-5 bg-charcoal-800 border-white/5 flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Category-wise Revenue</h2>
              {selectedEvent ? (
                <button onClick={() => setSelectedEvent(null)} className="text-xs text-crimson-500 hover:text-crimson-400 transition-colors">← All Events</button>
              ) : (
                <PieChart className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {Object.keys(eventCategoryMap).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : selectedEvent ? (
              (() => {
                const ev = eventCategoryMap[selectedEvent];
                if (!ev) { return <p className="text-gray-500 text-sm text-center py-8">No data</p>; }
                return (
                  <div className="flex-1 flex flex-col">
                    <p className="text-white text-sm font-semibold mb-3 truncate">{ev.title}</p>
                    <div className="flex-1 flex items-center gap-6">
                      <div className="w-40 h-40 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie data={ev.categories} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="revenue" stroke="none">
                              {ev.categories.map((c, i) => <Cell key={i} fill={VIBRANT_COLORS[i % VIBRANT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        {ev.categories.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: VIBRANT_COLORS[i % VIBRANT_COLORS.length] }} />
                            <span className="text-gray-400 truncate flex-1">{c.name}</span>
                            <span className="text-white font-medium shrink-0 ml-2">{formatPrice(c.revenue, curr, rate)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {Object.entries(eventCategoryMap).map(([id, ev]) => (
                  <button key={id} onClick={() => setSelectedEvent(id)} className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all text-left group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-crimson-600/20 to-purple-600/20 flex items-center justify-center shrink-0">
                        <PieChart className="w-3.5 h-3.5 text-crimson-400" />
                      </div>
                      <span className="text-gray-300 group-hover:text-white truncate text-sm transition-colors">{ev.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-gold-500 text-xs font-medium">{formatPrice(ev.revenue, curr, rate)}</span>
                      <span className="text-gray-500 text-[10px]">{ev.categories.length} cats</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Revenue by Status + Rejected Amount */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex">
          <Card className="p-5 bg-charcoal-800 border-white/5 flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Revenue by Status</h2>
              <PieChart className="w-4 h-4 text-gray-400" />
            </div>
            {statusData.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="flex-1 flex items-center gap-6">
                <div className="w-44 h-44 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {statusData.map((s) => {
                    const total = statusData.reduce((t, x) => t + x.value, 0);
                    const pct = total > 0 ? ((s.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-gray-400 capitalize flex-1 truncate">{s.name.replace("_", " ")}</span>
                        <span className="text-gray-500 text-xs shrink-0">{pct}%</span>
                        <span className="text-white font-semibold shrink-0 ml-1">{formatNumber(s.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex">
          <Card className="p-5 bg-charcoal-800 border-white/5 relative overflow-hidden flex flex-col h-full w-full">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full" />
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Rejected / Refunded</h2>
              <div className="p-2 bg-red-500/20 rounded-xl"><XCircle className="w-5 h-5 text-red-500" /></div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-3xl font-bold text-red-500">{formatPrice(rejectedAmount, curr, rate)}</p>
              <p className="text-gray-400 text-sm mt-1">Total amount from rejected orders</p>
              {rejectedAmount > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <p className="text-xs text-red-400">
                      {(rejectedAmount / (totalRevenue + rejectedAmount) * 100).toFixed(1)}% of total order value was rejected
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-charcoal-900 rounded-lg text-center">
                      <p className="text-lg font-bold text-red-400">{formatNumber(paidOrders)}</p>
                      <p className="text-[10px] text-gray-500">Paid Orders</p>
                    </div>
                    <div className="p-3 bg-charcoal-900 rounded-lg text-center">
                      <p className="text-lg font-bold text-gray-400">{totalRevenue + rejectedAmount > 0 ? Math.round(rejectedAmount / (totalRevenue + rejectedAmount) * 100) : 0}%</p>
                      <p className="text-[10px] text-gray-500">Loss Ratio</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Payment History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 bg-charcoal-800 border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Payment History</h2>
            <span className="text-xs text-gray-500">Last {recentPayments.length} payments</span>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No completed payments yet</p>
          ) : (
            <div className="overflow-x-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">Event</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Amount</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Payment ID</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p, i) => (
                    <motion.tr key={p.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2 sm:px-4 text-gray-300 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{p.event?.title || "Unknown"}</td>
                      <td className="py-3 px-2 sm:px-4 text-gold-500 font-medium text-xs sm:text-sm whitespace-nowrap">{formatPrice(p.total_amount, curr, rate)}</td>
                      <td className="py-3 px-2 sm:px-4 text-gray-400 font-mono text-xs truncate max-w-[80px] hidden sm:table-cell">{p.payment_id || "—"}</td>
                      <td className="py-3 px-2 sm:px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

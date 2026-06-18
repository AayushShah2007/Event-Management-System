"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, ShoppingCart, MapPin, User, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import DownloadReportModal from "@/components/shared/DownloadReportModal";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Record<string, any[]>>({});
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        setTotalUsers(data.count || 0);
        setUsers(data.users || []);
      } catch (e) { console.log(e) }
      finally { setLoading(false) }
    };
    loadUsers();
  }, []);

  const expandUser = async (userId: string) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (userOrders[userId]) return;
    try {
      const data = await supabaseQuery("orders", {
        select: "*",
        params: { "user_id": `eq.${userId}`, order: "created_at.desc", limit: "10" },
      });
      let ordersData: any[] = data || [];
      const eventIds = [...new Set(ordersData.map((o: any) => o.event_id).filter(Boolean))];
      if (eventIds.length) {
        const evData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
        const evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
        ordersData = ordersData.map((o: any) => ({ ...o, event: evMap[o.event_id] || null }));
      }
      setUserOrders((prev) => { return { ...prev, [userId]: ordersData }; });
    } catch (e) {
      console.error("Failed to fetch user orders:", e);
      setUserOrders((prev) => { return { ...prev, [userId]: [] }; });
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  const renderAddr = (label: string, val: string) => {
    const c = "flex items-center gap-1 truncate text-xs " + (val ? "" : "opacity-40");
    if (val) return (<div className={c}><span className="text-gray-500 shrink-0">{label}:</span><span className="text-gray-300 truncate">{val}</span></div>);
    return (<div className={c}><span className="text-gray-500 shrink-0">{label}:</span><span className="text-gray-600">Not set</span></div>);
  };

  const fetchAllOrders = async (userList: any[]) => {
    const userIds = userList.map((u) => u.id).filter(Boolean);
    if (!userIds.length) return {};
    const batchSize = 50;
    const result: Record<string, any[]> = {};
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const data = await supabaseQuery("orders", {
        select: "*",
        params: { user_id: `in.(${batch.join(",")})`, order: "created_at.desc", limit: "500" },
      }).catch(() => []) || [];
      const ordersArr: any[] = Array.isArray(data) ? data : [];
      const eventIds = [...new Set(ordersArr.map((o: any) => o.event_id).filter(Boolean))];
      let evMap: Record<string, any> = {};
      if (eventIds.length) {
        const evData = await supabaseQuery("events", { select: "id,title", params: { id: `in.(${eventIds.join(",")})` } }).catch(() => []);
        evMap = Object.fromEntries((evData || []).map((e: any) => [e.id, e]));
      }
      ordersArr.forEach((o) => { o.event = evMap[o.event_id] || null; });
      ordersArr.forEach((o) => {
        if (!result[o.user_id]) result[o.user_id] = [];
        result[o.user_id].push(o);
      });
    }
    return result;
  };

  const userColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "addressLine1", label: "Address Line 1" },
    { key: "addressLine2", label: "Address Line 2" },
    { key: "city", label: "City" },
    { key: "district", label: "District" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
    { key: "joined", label: "Joined" },
    { key: "pastOrders", label: "Past Order IDs" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Analysis</h1>
          <p className="text-gray-400 mt-1">{totalUsers} total users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setReportOpen(true)} disabled={loading || filtered.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-charcoal-800 border-white/5 text-white" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-charcoal-800 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-charcoal-800 border-white/5">
          <User className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No users found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-charcoal-800 border-white/5 overflow-hidden cursor-pointer hover:bg-white/5" onClick={() => expandUser(u.id)}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Name</p>
                        <p className="text-white font-medium truncate">{u.full_name || u.email?.split("@")[0] || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Email</p>
                        <p className="text-gray-300 truncate">{u.email || "\u2014"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Phone</p>
                        <p className="text-gray-300">{u.phone || "\u2014"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Role</p>
                        <p className="text-gray-300">{u.role || "user"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-xs">Joined</p>
                        <p className="text-gray-400 text-sm">{u.created_at ? formatDate(u.created_at) : "\u2014"}</p>
                        {expandedId === u.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>{renderAddr("Address Line 1", u.address_line1)}</div>
                      <div>{renderAddr("Address Line 2", u.address_line2)}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>{renderAddr("City", u.city)}</div>
                      <div>{renderAddr("District", u.district)}</div>
                      <div>{renderAddr("State", u.state)}</div>
                      <div>{renderAddr("Pincode", u.pincode)}</div>
                    </div>
                  </div>
                </div>
                {expandedId === u.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="border-t border-white/5 p-4">
                    <p className="text-gray-400 text-xs mb-3 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Past Orders</p>
                    {userOrders[u.id] === undefined ? (
                      <div className="h-10 bg-white/5 rounded animate-pulse" />
                    ) : userOrders[u.id].length === 0 ? (
                      <p className="text-gray-500 text-sm">No past orders</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {userOrders[u.id].map((o) => (
                          <Card key={o.id} className="bg-white/5 border-white/10 p-3">
                            <p className="text-white text-sm font-medium truncate">{o.event?.title || "Unknown Event"}</p>
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className="text-gray-500">{formatDate(o.created_at)}</span>
                              <span className="text-gold-500 font-semibold">{formatPrice(o.total_amount)}</span>
                            </div>
                            <span className={cn("mt-2 inline-block px-1.5 py-0.5 rounded text-xs", o.status === "paid" ? "bg-green-500/20 text-green-500" : "bg-gold-500/20 text-gold-500")}>{o.status}</span>
                          </Card>
                        ))}
                      </div>
                    )}
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
        title="User Analysis Report"
        filename="user-analysis-report"
        columns={userColumns}
        hideCsv
        data={filtered.map((u) => ({
          name: u.full_name || u.email?.split("@")[0] || "-",
          email: u.email || "-",
          phone: u.phone || "-",
          role: u.role || "user",
          addressLine1: u.address_line1 || "-",
          addressLine2: u.address_line2 || "-",
          city: u.city || "-",
          district: u.district || "-",
          state: u.state || "-",
          pincode: u.pincode || "-",
          joined: u.created_at ? formatDate(u.created_at) : "-",
          pastOrders: "",
        }))}
        onBeforeDownload={async (format) => {
          if (format === "csv") { toast.error("CSV download is not available for this report"); setReportOpen(false); return true; }
          const allOrders = await fetchAllOrders(filtered);
          if (format === "pdf") {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
              import("jspdf"),
              import("jspdf-autotable"),
            ]);
            const doc = new jsPDF({ orientation: "landscape" });

            // Title
            doc.setFontSize(22);
            doc.text("User Analysis Report", 14, 18);
            doc.setFontSize(9);
            doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Users: ${filtered.length}`, 14, 26);

            // Main users table
            const mainRows = filtered.map((u) => {
              const orders = allOrders[u.id] || [];
              return [
                u.full_name || u.email?.split("@")[0] || "-",
                u.email || "-",
                u.phone || "-",
                u.role || "user",
                [u.city, u.district, u.state].filter(Boolean).join(", ") || "-",
                u.created_at ? formatDate(u.created_at) : "-",
                String(orders.length),
                orders.length ? orders.map((o: any) => o.id).join("\n") : "—",
              ];
            });

            autoTable(doc, {
              head: [["Name", "Email", "Phone", "Role", "Location", "Joined", "Orders", "Recent Order IDs"]],
              body: mainRows,
              startY: 32,
              styles: { fontSize: 7, cellPadding: 2, halign: "center" },
              headStyles: { fillColor: [139, 28, 45], halign: "center", fontSize: 8 },
              columnStyles: { 0: { halign: "left", cellWidth: 32 }, 1: { cellWidth: 50 }, 7: { halign: "left", cellWidth: 55 } },
              margin: { left: 14, right: 14 },
            });

            let y = (doc as any).lastAutoTable.finalY + 10;

            // Per-user order details
            for (const u of filtered) {
              const orders = allOrders[u.id] || [];
              if (y > 240) { doc.addPage(); y = 20; }

              doc.setFontSize(12);
              doc.setTextColor(139, 28, 45);
              doc.text(`${u.full_name || u.email || "Unknown"}`, 14, y);
              doc.setTextColor(0, 0, 0);
              y += 5;

              if (orders.length) {
                const orderRows = orders.map((o: any) => [
                  o.id, o.event?.title || "-",
                  o.created_at ? new Date(o.created_at).toLocaleDateString() : "-",
                  formatPrice(o.total_amount || 0), o.status || "-",
                ]);
                autoTable(doc, {
                  head: [["Order ID", "Event", "Date", "Amount", "Status"]],
                  body: orderRows,
                  startY: y,
                  styles: { fontSize: 6.5, cellPadding: 1.5, halign: "center" },
                  headStyles: { fillColor: [80, 80, 80], halign: "center", fontSize: 7 },
                  margin: { left: 14, right: 14 },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
              } else {
                doc.setFontSize(8);
                doc.text("No past orders", 14, y);
                y += 8;
              }
            }

            doc.save("user-analysis-report.pdf");
            toast.success("PDF downloaded!");
            setReportOpen(false);
            return true;
          }
        }}
      />
    </div>
  );
}

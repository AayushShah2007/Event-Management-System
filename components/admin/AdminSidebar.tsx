"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Ticket,
  Bell,
  ChevronRight,
  Percent,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAppStore } from "@/store";
import { supabaseCount } from "@/lib/supabase-rest";
import toast from "react-hot-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: ShoppingCart, label: "New Orders", href: "/admin/orders", badge: true },
  { icon: History, label: "Order History", href: "/admin/history" },
  { icon: Calendar, label: "Live Events", href: "/admin/events" },
  { icon: MessageSquare, label: "User Reviews", href: "/admin/reviews" },
  { icon: Users, label: "User Analysis", href: "/admin/users" },
  { icon: DollarSign, label: "Earnings", href: "/admin/earnings" },
  { icon: Percent, label: "Discount Coupons", href: "/admin/coupons" },
];

export function AdminSidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const { user } = useAppStore();
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef(0);

  // Poll for pending order count + notification
  useEffect(() => {
    const fetchCount = async () => {
      const count = await supabaseCount("orders", { status: "eq.pending" }).catch(() => 0);
      if (count > prevCountRef.current && prevCountRef.current > 0) {
        toast.custom((t) => (
          <div className="bg-crimson-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2" onClick={() => toast.dismiss(t.id)}>
            <Bell className="w-4 h-4" />
            New order received! ({count} pending)
          </div>
        ));
      }
      prevCountRef.current = count;
      setPendingCount(count);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <aside
         className={cn(
           "flex flex-col overflow-hidden transition-all duration-300 shrink-0 border-r",
           "fixed inset-y-0 left-0 z-40 md:sticky md:inset-y-auto",
           isDark ? "bg-charcoal-800 border-white/5" : "bg-white border-gray-200",
           isOpen ? "w-64" : "w-0 md:w-64"
         )}
       >
        <div className="p-4 border-b border-white/5 shrink-0 space-y-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-crimson-600 to-purple-600 flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-br from-crimson-600 to-purple-600 bg-clip-text text-transparent">EventPass</span>
          </Link>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-crimson-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.email ? (user.email[0] + (user.email.split("@")[0][1] || "")).toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.email?.split("@")[0] || "Admin"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || ""}</p>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onToggle}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                  isActive
                    ? "bg-crimson-600 text-white"
                    : isDark
                    ? "text-gray-400 hover:bg-white/5 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-crimson-500")} />
                <span className="font-medium">{item.label}</span>
                {item.badge && pendingCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-crimson-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0">
          <div className={cn("p-4 rounded-lg", isDark ? "bg-white/5" : "bg-gray-100")}>
            <p className={isDark ? "text-gray-400 text-sm" : "text-gray-600 text-sm"}>Need help?</p>
            <p className="text-white text-sm font-medium">Contact Support</p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onToggle} />
      )}
    </>
  );
}

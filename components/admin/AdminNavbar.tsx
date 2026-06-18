"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, User, Settings, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { supabaseCount } from "@/lib/supabase-rest";
import { getInitials, cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function AdminNavbar() {
  const router = useRouter();
  const { user, profile, theme } = useAppStore();
  const { logout } = useAuth();
  const isDark = theme === "dark";
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try { const c = await supabaseCount("orders", { status: "eq.pending" }); setPendingCount(c); }
      catch { /* ignore */ }
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

    const handleLogout = async () => {
      try {
        await Promise.race([
          logout(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 10000))
        ]);
        toast.success("Logged out successfully");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to logout");
      }
      router.push("/");
    };

  return (
    <div className="flex items-center gap-4">
      {/* Search */}
      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search..."
          className="w-64 pl-10 bg-transparent"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => router.push("/admin/orders")}>
        <Bell className="w-5 h-5 text-gray-400" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4 flex items-center justify-center bg-crimson-500 text-white text-[10px] font-bold rounded-full px-1">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-crimson-600 text-white text-sm">
                {getInitials(profile?.full_name || user?.email || "Admin")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-charcoal-800 border-white/10 text-white">
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-crimson-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

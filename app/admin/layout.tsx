"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { Loader2, Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, theme } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  const isDark = theme === "dark";

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const adminEmails = ['kinjal2506shah@gmail.com', 'aayushshah458@gmail.com'];
    if (adminEmails.includes(user.email || '')) {
      setLoading(false);
    } else {
      router.push("/");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-900">
        <Loader2 className="w-8 h-8 animate-spin text-crimson-500" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-4 sm:px-6 shrink-0",
          isDark ? "border-white/5 bg-charcoal-800" : "border-gray-200 bg-white"
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors relative z-50"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-white hidden md:block">Admin Panel</h1>
          </div>
          <AdminNavbar />
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

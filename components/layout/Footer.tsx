"use client";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

export function Footer() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";

  return (
    <footer
      className={cn(
        isDark
          ? "bg-gradient-to-b from-charcoal-950 to-charcoal-950 border-t border-white/5"
          : "bg-gradient-to-b from-charcoal-900 to-charcoal-900 border-t border-gray-800"
      )}
    >
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-crimson-500/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crimson-600 to-purple-600 flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">EventPass</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your premium destination for booking unforgettable event experiences.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/events" className="hover:text-crimson-500 transition-colors">Events</Link></li>
                <li><Link href="/orders" className="hover:text-crimson-500 transition-colors">My Orders</Link></li>
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">FAQs</Link></li>
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-crimson-500 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe to our newsletter for exclusive updates
              </p>
              <div className="flex">
                <Input
                  placeholder="Enter your email"
                  className="rounded-r-none bg-white/5 border-white/10"
                />
                <Button className="rounded-l-none">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} EventPass. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  User,
  LogOut,
  Home,
  Ticket,
  History,
  Settings,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
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
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onAuthClick: () => void;
}

export function Navbar({ onAuthClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, profile, theme, location } = useAppStore();
  const { logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark = theme === "dark";
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/orders", label: "My Orders" },
  ];

  const handleLogout = async () => {
    try {
      await Promise.race([
        logout(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), 10000))
      ]);
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
    }
    window.location.href = "/";
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isDark
          ? "bg-charcoal-900/80 backdrop-blur-xl"
          : "bg-white/80 backdrop-blur-xl",
        isScrolled && "border-b border-white/10"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crimson-600 to-purple-600 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">EventPass</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-crimson-500",
                  pathname === link.href
                    ? "text-crimson-500"
                    : isDark
                    ? "text-gray-300"
                    : "text-gray-700"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Location */}
          {location && (
            <div className={cn(
              "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              isDark ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-700"
            )}>
              <MapPin className="w-3.5 h-3.5 text-crimson-500" />
              {location.display}
            </div>
          )}

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                className={cn(
                  "pl-10 bg-transparent border-none focus-visible:ring-0",
                  isDark ? "bg-white/5" : "bg-gray-100"
                )}
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search Toggle - Mobile */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/10 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-crimson-600 text-white text-sm">
                        {getInitials(profile?.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-charcoal-800 border-white/10"
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer text-white">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer text-white">
                      <History className="w-4 h-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-crimson-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onAuthClick}
                className="hidden md:flex"
                size="sm"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden pb-4"
            >
              <Input
                placeholder="Search events..."
                className="bg-white/5"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-charcoal-900 border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block py-2 px-4 rounded-lg transition-colors",
                    pathname === link.href
                      ? "bg-crimson-600/20 text-crimson-500"
                      : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 px-4 rounded-lg transition-colors text-crimson-400 hover:bg-crimson-600/10 font-medium"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Admin Panel
                </Link>
              )}
              {!user && (
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onAuthClick();
                  }}
                  className="w-full mt-4"
                >
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
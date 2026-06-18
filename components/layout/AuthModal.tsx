"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store";
import { WR_STATIONS } from "@/lib/wr-stations";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().length(10, "Phone must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  address_line1: z.string().min(3, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  district: z.string().min(1, "Select a district"),
  pincode: z.string().length(6, "Enter a valid 6-digit pincode"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("login");
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const { login, signup } = useAuth();
  const { theme } = useAppStore();
  const isDark = theme === "dark";

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "", address_line1: "", address_line2: "", city: "Mumbai", district: "", pincode: "" },
  });

    const onLogin = async (data: z.infer<typeof loginSchema>) => {
      setLoginLoading(true);
      try {
        const result = await login(data.email, data.password);
        console.log("Login result:", result);
        if (result?.success) {
          onClose();
          if (data.email === 'kinjal2506shah@gmail.com' || data.email === 'aayushshah458@gmail.com') {
            window.location.href = "/admin";
          } else {
            window.location.href = "/";
          }
        } else {
          // Login failed - show error
          toast.error(result?.error || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        toast.error("An unexpected error occurred");
      } finally {
        setLoginLoading(false);
      }
    };

  const onSignup = async (data: z.infer<typeof signupSchema>) => {
    setSignupLoading(true);
    try {
      const result = await signup(data.email, data.password, data.fullName, data.phone, {
        address_line1: data.address_line1,
        address_line2: data.address_line2 || "",
        city: data.city,
        district: data.district,
        state: "Maharashtra",
        pincode: data.pincode,
      });
      if (result?.success) {
        toast.success("Account created! Check your email for confirmation.");
        onClose();
      } else {
        toast.error(result?.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative w-full max-w-md rounded-2xl border overflow-hidden",
              isDark
                ? "bg-charcoal-900 border-white/10"
                : "bg-white border-gray-200"
            )}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-crimson-600/10 via-transparent to-gold-500/10 pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="relative px-6 pt-4 pb-2 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-crimson-600 to-purple-600 flex items-center justify-center shadow-lg shadow-crimson-600/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-charcoal-900")}>EventPass</h2>
              <p className={cn("mt-1 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Sign in or create your account</p>
            </div>

            {/* Form */}
            <div className="relative px-6 pb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-3 bg-gray-100 dark:bg-charcoal-800">
                  <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-crimson-600 data-[state=active]:text-white">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-crimson-600 data-[state=active]:text-white">Create Account</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" placeholder="your@email.com" className="h-9 text-sm" {...loginForm.register("email")} />
                      {loginForm.formState.errors.email && <p className="text-xs text-crimson-500">{loginForm.formState.errors.email.message as string}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="login-password">Password</Label>
                      <Input id="login-password" type="password" placeholder="Enter password" className="h-9 text-sm" {...loginForm.register("password")} />
                      {loginForm.formState.errors.password && <p className="text-xs text-crimson-500">{loginForm.formState.errors.password.message as string}</p>}
                    </div>
                    <Button type="submit" className="w-full" size="default" disabled={loginLoading}>
                      {loginLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Personal Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Full Name</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Your full name</p>
                        <Input placeholder="John Doe" className="h-9 text-sm mt-1" {...signupForm.register("fullName")} />
                        {signupForm.formState.errors.fullName && <p className="text-xs text-crimson-500">{signupForm.formState.errors.fullName.message as string}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">We'll send confirmation here</p>
                        <Input type="email" placeholder="your@email.com" className="h-9 text-sm mt-1" {...signupForm.register("email")} />
                        {signupForm.formState.errors.email && <p className="text-xs text-crimson-500">{signupForm.formState.errors.email.message as string}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">10-digit mobile number</p>
                        <Input type="tel" placeholder="9876543210" className="h-9 text-sm mt-1" {...signupForm.register("phone")} />
                        {signupForm.formState.errors.phone && <p className="text-xs text-crimson-500">{signupForm.formState.errors.phone.message as string}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">Password</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">At least 6 characters</p>
                        <Input type="password" placeholder="Password (min 6)" className="h-9 text-sm mt-1" {...signupForm.register("password")} />
                        {signupForm.formState.errors.password && <p className="text-xs text-crimson-500">{signupForm.formState.errors.password.message as string}</p>}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Confirm Password</Label>
                      <p className="text-[10px] text-gray-500 mt-0.5">Re-enter your password</p>
                      <Input type="password" placeholder="Re-enter password" className="h-9 text-sm mt-1" {...signupForm.register("confirmPassword")} />
                      {signupForm.formState.errors.confirmPassword && <p className="text-xs text-crimson-500">{signupForm.formState.errors.confirmPassword.message as string}</p>}
                    </div>

                    <hr className="border-white/10" />

                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Address Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Address Line 1</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">House/Flat No, Street, Area</p>
                        <Input placeholder="e.g. 42, MG Road" className="h-9 text-sm mt-1" {...signupForm.register("address_line1")} />
                        {signupForm.formState.errors.address_line1 && <p className="text-xs text-crimson-500">{signupForm.formState.errors.address_line1.message as string}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">Address Line 2</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Apartment, Building (optional)</p>
                        <Input placeholder="e.g. Green Tower, Phase 2" className="h-9 text-sm mt-1 bg-white/5 text-white" {...signupForm.register("address_line2")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">City</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Your city</p>
                        <Input placeholder="Mumbai" className="h-9 text-sm mt-1 bg-white/5 text-white" {...signupForm.register("city")} />
                        {signupForm.formState.errors.city && <p className="text-xs text-crimson-500">{signupForm.formState.errors.city.message as string}</p>}
                      </div>
                      <div>
                        <Label className="text-xs">District</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Select your area</p>
                        <Select value={signupForm.watch("district")} onValueChange={(v) => signupForm.setValue("district", v, { shouldValidate: true })}>
                          <SelectTrigger className="h-9 text-sm mt-1 bg-white/5 text-white border-white/10">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-charcoal-800 border-white/10 max-h-48">
                            {WR_STATIONS.map((station) => (
                              <SelectItem key={station} value={station} className="text-white hover:bg-white/10">{station}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {signupForm.formState.errors.district && <p className="text-xs text-crimson-500">{signupForm.formState.errors.district.message as string}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">State</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">Your state</p>
                        <Input value="Maharashtra" disabled className="h-9 text-sm mt-1 bg-white/5 text-gray-400" />
                      </div>
                      <div>
                        <Label className="text-xs">Pincode</Label>
                        <p className="text-[10px] text-gray-500 mt-0.5">6-digit pincode</p>
                        <Input placeholder="400001" maxLength={6} className="h-9 text-sm mt-1 bg-white/5 text-white" {...signupForm.register("pincode")} onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6); signupForm.setValue("pincode", e.target.value); }} />
                        {signupForm.formState.errors.pincode && <p className="text-xs text-crimson-500">{signupForm.formState.errors.pincode.message as string}</p>}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="default" disabled={signupLoading}>
                      {signupLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
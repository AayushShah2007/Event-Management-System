"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";
import type { User, Profile } from "@/types";

const ADMIN_EMAILS = ['kinjal2506shah@gmail.com', 'aayushshah458@gmail.com'];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function useAuth() {
  const { setUser, setProfile, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(15000)
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        const errMsg = authData.msg || authData.error_description || authData.error || "Authentication failed";
        if (errMsg.includes("Invalid login credentials") || authResponse.status === 400) {
          return { success: false, error: "Invalid email or password" };
        }
        return { success: false, error: errMsg };
      }

      const userData = authData.user || authData;

      const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
      const userRole = isAdminEmail ? 'admin' : "user";

      const user: User = {
        id: userData.id,
        email: userData.email || email,
        role: userRole,
        created_at: userData.created_at,
      };

      setUser(user);
      return { success: true, user };
    } catch (error: unknown) {
      const err = error as Error & { message?: string };
      let message = "Login failed";
      if (err.name === 'TimeoutError' || err.message?.includes("timed out") || err.message?.includes("aborted")) {
        message = "Server not responding. Check your Supabase connection.";
      } else if (err.message?.includes("Invalid login")) {
        message = "Invalid email or password";
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, phone: string, address?: Record<string, string>) => {
    try {
      setLoading(true);

      const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName, phone, ...(address || {}) }
        }),
        signal: AbortSignal.timeout(15000)
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        const errMsg = authData.msg || authData.error_description || authData.error || "Signup failed";
        if (errMsg.includes("already registered")) {
          return { success: false, error: "Email already registered" };
        }
        return { success: false, error: errMsg };
      }

      const userData = authData.user || authData;

      const profile: Profile = {
        id: "",
        user_id: userData.id,
        full_name: fullName,
        phone: phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const user: User = {
        id: userData.id,
        email: email,
        role: "user",
        created_at: new Date().toISOString(),
      };

      setUser(user);
      setProfile(profile);
      return { success: true, user };
    } catch (error: unknown) {
      const err = error as Error & { message?: string };
      let message = "Signup failed";
      if (err.message?.includes("already registered")) {
        message = "Email already registered";
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    storeLogout();
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  return { loading, login, signup, logout };
}

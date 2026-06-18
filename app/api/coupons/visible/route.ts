import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET() {
  try {
    const url = `${supabaseUrl}/rest/v1/coupons?select=code,type,value,min_order_amount,max_discount,expires_at&is_active=eq.true&is_visible=eq.true&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

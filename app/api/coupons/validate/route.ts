import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function supabaseFetch(path: string, options?: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  select?: string;
}) {
  const { method = "GET", body, params, select } = options || {};
  let url = `${supabaseUrl}/rest/v1/${path}`;
  const queryParams = new URLSearchParams();
  if (select) queryParams.set("select", select);
  if (params) {
    Object.entries(params).forEach(([k, v]) => queryParams.set(k, v));
  }
  const qs = queryParams.toString();
  if (qs) url += `${url.includes("?") ? "&" : "?"}${qs}`;
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    Accept: "application/json",
  };
  if (body) {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = "return=representation";
  }
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) });
  if (!res.ok) { const text = await res.text(); throw new Error(`Supabase ${res.status}: ${text}`); }
  if (method === "DELETE" || res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function POST(req: Request) {
  try {
    const { code, orderAmount } = await req.json();
    if (!code) return NextResponse.json({ valid: false, error: "Coupon code is required" }, { status: 400 });

    const data = await supabaseFetch("coupons", {
      select: "*",
      params: { code: `eq.${code}`, limit: "1" },
    });

    const coupon = Array.isArray(data) ? data[0] : data;
    if (!coupon) return NextResponse.json({ valid: false, error: "Invalid coupon code" });

    if (!coupon.is_active) return NextResponse.json({ valid: false, error: "This coupon is no longer active" });

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its usage limit" });
    }

    if (orderAmount && orderAmount < coupon.min_order_amount) {
      return NextResponse.json({ valid: false, error: `Minimum order amount of ₹${coupon.min_order_amount} required` });
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = Math.round(orderAmount * (coupon.value / 100));
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.value;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        used_count: coupon.used_count,
        usage_limit: coupon.usage_limit,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}

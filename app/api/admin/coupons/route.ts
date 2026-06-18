import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
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

export async function GET() {
  try {
    const data = await supabaseFetch("coupons", {
      select: "*",
      params: { order: "created_at.desc" },
    });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, type, value, min_order_amount, max_discount, usage_limit, expires_at } = body;
    if (!code || !type || !value) {
      return NextResponse.json({ error: "Missing required fields: code, type, value" }, { status: 400 });
    }
    const data = await supabaseFetch("coupons", {
      method: "POST",
      body: { code: code.toUpperCase(), type, value, min_order_amount: min_order_amount || 0, max_discount: max_discount || null, usage_limit: usage_limit || 0, expires_at: expires_at || null },
      select: "*",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
    const body = await req.json();
    const data = await supabaseFetch(`coupons?id=eq.${id}`, {
      method: "PATCH",
      body,
      select: "*",
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
    await supabaseFetch(`coupons?id=eq.${id}`, { method: "DELETE" });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

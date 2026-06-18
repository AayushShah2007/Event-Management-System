import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function supabaseFetch(path: string, options?: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  select?: string;
  useServiceRole?: boolean;
}) {
  const { method = "GET", body, params, select, useServiceRole } = options || {};
  const key = useServiceRole ? supabaseServiceKey : supabaseAnonKey;
  let url = `${supabaseUrl}/rest/v1/${path}`;
  const queryParams = new URLSearchParams();
  if (select) queryParams.set("select", select);
  if (params) {
    Object.entries(params).forEach(([k, v]) => queryParams.set(k, v));
  }
  const qs = queryParams.toString();
  if (qs) url += `${url.includes("?") ? "&" : "?"}${qs}`;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (body) {
    headers["Content-Type"] = "application/json";
    headers["Prefer"] = "return=representation";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (method === "DELETE" || res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";
    const data = await supabaseFetch("reviews", {
      select: "*",
      params: { order: "created_at.desc", limit },
    });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, user_name, rating, comment } = body;
    if (!user_id || !user_name || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    const data = await supabaseFetch("reviews", {
      method: "POST",
      body: { user_id, user_name, rating, comment },
      select: "*",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }
    await supabaseFetch(`reviews?id=eq.${id}`, { method: "DELETE", useServiceRole: true });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

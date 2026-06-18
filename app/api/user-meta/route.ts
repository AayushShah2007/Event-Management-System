import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || !url) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();
    return NextResponse.json({ user_metadata: data.user_metadata || {} });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

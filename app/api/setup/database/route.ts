import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const results: string[] = [];

  // Try using supabase-js with service role to add columns via raw SQL function call
  if (serviceKey && url) {
    try {
      const client = createClient(url, serviceKey, { db: { schema: "public" } });

      const { error } = await client.rpc("exec_sql", {
        query: `
          ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS address_line1 TEXT DEFAULT '',
          ADD COLUMN IF NOT EXISTS address_line2 TEXT DEFAULT '',
          ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai',
          ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '',
          ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra',
          ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '';
        `,
      });

      if (error) {
        results.push(`exec_sql RPC failed: ${error.message}`);
      } else {
        results.push("Columns added successfully via exec_sql RPC");
      }
    } catch (e: any) {
      results.push(`exec_sql RPC error: ${e.message}`);
    }
  }

  // Fallback: try direct REST SQL endpoint
  if (serviceKey && url) {
    try {
      const sql = `
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS address_line1 TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS address_line2 TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai',
        ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra',
        ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '';
      `;
      const res = await fetch(`${url}/rest/v1/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });
      if (res.ok) {
        results.push("Columns added via /rest/v1/exec");
      } else {
        results.push(`/rest/v1/exec failed: ${await res.text().then((t) => t.slice(0, 150))}`);
      }
    } catch (e: any) {
      results.push(`/rest/v1/exec error: ${e.message}`);
    }
  }

  // If both failed, provide the SQL for manual execution
  const sqlCommand = `
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address_line1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address_line2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Mumbai',
ADD COLUMN IF NOT EXISTS district TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra',
ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT '';
  `.trim();

  return NextResponse.json({
    success: results.some((r) => r.includes("successfully") || r.includes("added")),
    results,
    sqlManual: sqlCommand,
    message: results.length === 0
      ? "No methods attempted. Missing SUPABASE_SERVICE_ROLE_KEY."
      : results.every((r) => r.includes("failed") || r.includes("error"))
        ? `Could not add columns automatically. Please run this SQL in your Supabase SQL Editor:\n\n${sqlCommand}`
        : "Database setup completed!",
  });
}

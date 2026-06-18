import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { file, name } = await req.json();
    if (!file || !name) return NextResponse.json({ error: "No file data" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const bucket = "events";

    const ext = name.split(".").pop() || "png";
    const fileName = `venue-plans/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const base64Data = file.split(",")[1] || file;
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure bucket exists
    const { error: bucketError } = await supabase.storage.getBucket(bucket);
    if (bucketError) {
      const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
      if (createError) return NextResponse.json({ error: `Bucket error: ${createError.message}` }, { status: 500 });
    }

    // Upload file
    const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, buffer, {
      contentType: "image/png",
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: `Upload error: ${uploadError.message}` }, { status: 500 });

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return NextResponse.json({ url: publicUrl });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}

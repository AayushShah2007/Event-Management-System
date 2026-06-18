import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let users: any[] = [];
  let totalCount = 0;

  if (serviceKey) {
    try {
      const authUrl = `${url}/auth/v1/admin/users`;
      const res = await fetch(authUrl, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        users = (data?.users || []).map((u: any) => {
          const m = u.user_metadata || {};
          return {
            id: u.id,
            email: u.email,
            phone: u.phone || m.phone || "",
            full_name: m.full_name || u.email?.split("@")[0] || "Unknown",
            created_at: u.created_at,
            avatar_url: m.avatar_url || "",
            address_line1: m.address_line1 || "",
            address_line2: m.address_line2 || "",
            city: m.city || "Mumbai",
            district: m.district || "",
            state: m.state || "Maharashtra",
            pincode: m.pincode || "",
          };
        });
        totalCount = users.length;
      }
    } catch {}
  }

  if (url && anonKey) {
    try {
      const [profilesRes, addressesRes] = await Promise.all([
        fetch(`${url}/rest/v1/profiles?select=*`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
        fetch(`${url}/rest/v1/addresses?select=*&order=created_at.desc`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
      ]);

      if (profilesRes.ok) {
        const profiles = await profilesRes.json();
        if (Array.isArray(profiles)) {
          const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
          for (const u of users) {
            const p = profileMap.get(u.id);
            if (p) {
              u.full_name = p.full_name || u.full_name;
              u.phone = p.phone || u.phone;
              u.avatar_url = p.avatar_url || u.avatar_url;
              u.address_line1 = p.address_line1 || u.address_line1;
              u.address_line2 = p.address_line2 || u.address_line2;
              u.city = p.city || u.city;
              u.district = p.district || u.district;
              u.state = p.state || u.state;
              u.pincode = p.pincode || u.pincode;
            }
          }
          if (profiles.length > totalCount) totalCount = profiles.length;
        }
      }

      if (addressesRes.ok) {
        const addresses = await addressesRes.json();
        if (Array.isArray(addresses)) {
          const addrMap = new Map<string, any>();
          for (const a of addresses) {
            if (!addrMap.has(a.user_id)) addrMap.set(a.user_id, a);
          }
          for (const u of users) {
            const a = addrMap.get(u.id);
            if (a) {
              u.address_line1 = a.address_line1 || u.address_line1;
              u.address_line2 = a.address_line2 || u.address_line2;
              u.city = a.city || u.city;
              u.district = a.district || u.district;
              u.state = a.state || u.state;
              u.pincode = a.pincode || u.pincode;
            }
          }
        }
      }
    } catch {}
  }

  return NextResponse.json({ count: totalCount, users });
}

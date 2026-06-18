const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function supabaseQuery(path: string, options?: {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  select?: string;
}) {
  const { method = 'GET', body, params, select } = options || {};

  let url = `${supabaseUrl}/rest/v1/${path}`;
  const queryParams = new URLSearchParams();
  if (select) queryParams.set('select', select);
  if (params) {
    Object.entries(params).forEach(([k, v]) => queryParams.set(k, v));
  }
  const qs = queryParams.toString();
  if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`;

  const headers: Record<string, string> = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Accept': 'application/json',
  };
  if (body) headers['Content-Type'] = 'application/json';

  const prefer: string[] = [];
  if ((method === 'POST' || method === 'PATCH') && select) prefer.push('return=representation');
  if (prefer.length) headers['Prefer'] = prefer.join(',');

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

  if (method === 'DELETE' || res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  return JSON.parse(text);
}

export async function supabaseCount(table: string, filter?: Record<string, string>) {
  const url = `${supabaseUrl}/rest/v1/${table}`;
  const params = new URLSearchParams({ select: 'id' });
  if (filter) {
    Object.entries(filter).forEach(([k, v]) => params.set(k, v));
  }
  const qs = params.toString();

  const res = await fetch(`${url}?${qs}`, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return 0;
  try {
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

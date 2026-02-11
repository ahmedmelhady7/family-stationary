import { requireEnv } from './http.ts';

function headers() {
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    'Content-Type': 'application/json',
  };
}

function baseUrl() {
  return `${requireEnv('SUPABASE_URL')}/rest/v1`;
}

export async function restInsert(table: string, payload: unknown) {
  const response = await fetch(`${baseUrl()}/${table}`, {
    method: 'POST',
    headers: {
      ...headers(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function restUpsert(table: string, payload: unknown, onConflict: string) {
  const response = await fetch(`${baseUrl()}/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: {
      ...headers(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function restSelect(table: string, query = '') {
  const response = await fetch(`${baseUrl()}/${table}${query}`, {
    method: 'GET',
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function restPatch(table: string, query: string, payload: unknown) {
  const response = await fetch(`${baseUrl()}/${table}${query}`, {
    method: 'PATCH',
    headers: {
      ...headers(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function parseJsonSafe<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch (_error) {
    return fallback;
  }
}

export function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

let cache: Record<string, unknown> | null = null;

function readPath(value: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, value);

  return typeof result === 'string' ? result : path;
}

export async function loadMessages() {
  if (cache) {
    return cache;
  }

  const file = new URL('./messages.ar.json', import.meta.url);
  const text = await Deno.readTextFile(file);
  cache = JSON.parse(text);
  return cache;
}

export async function t(path: string, vars: Record<string, string | number> = {}) {
  const messages = await loadMessages();
  let text = readPath(messages as Record<string, unknown>, path);
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, String(value));
  }
  return text;
}

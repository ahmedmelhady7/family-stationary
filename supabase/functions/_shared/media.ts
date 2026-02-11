import { requireEnv } from './http.ts';

const META_BASE = 'https://graph.facebook.com/v21.0';

function authHeader() {
  return { Authorization: `Bearer ${requireEnv('WA_TOKEN')}` };
}

export async function downloadMetaMedia(mediaId: string) {
  const response = await fetch(`${META_BASE}/${mediaId}`, {
    headers: authHeader(),
  });

  if (!response.ok) {
    throw new Error(`meta media lookup failed: ${await response.text()}`);
  }

  const media = await response.json();
  if (!media?.url) {
    throw new Error('meta media url missing');
  }

  const binary = await fetch(media.url, {
    headers: authHeader(),
  });

  if (!binary.ok) {
    throw new Error(`meta media download failed: ${await binary.text()}`);
  }

  return await binary.arrayBuffer();
}

export async function uploadProductImage(productId: string, imageBuffer: ArrayBuffer, extension = 'webp') {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const path = `product-images/${productId}/${crypto.randomUUID()}.${extension}`;
  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/products/${encodeURIComponent(path)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': extension === 'webp' ? 'image/webp' : 'application/octet-stream',
      },
      body: imageBuffer,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(`storage upload failed: ${await uploadResponse.text()}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/products/${path}`;
  return { path, publicUrl };
}

export async function convertToWebp(buffer: ArrayBuffer) {
  // Conversion is delegated to optimize-image function in production.
  return buffer;
}

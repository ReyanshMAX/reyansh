'use client';

import { MEDIA_BUCKET, type MediaItem } from '@/lib/media';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { registerMedia } from '@/server/media';

const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.85;
const MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];

function slugifyName(name: string): string {
  return name.toLowerCase().replace(/\.pdf$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  if (!blob) throw new Error('This browser cannot encode WebP');
  return { blob, width, height };
}

async function svgOrGifSize(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

// docs/DASHBOARD.md "Media": raster images → WebP ≤ 2400px long edge, q=0.85;
// SVG/GIF stored as given; PDFs → files/<uuid>-<name>.pdf. Then registerMedia.
export async function uploadMedia(file: File, alt: string): Promise<MediaItem> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error(`${file.name}: unsupported file type`);
  const id = crypto.randomUUID();
  const now = new Date();
  const dir = `img/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  let path: string;
  let body: Blob;
  let contentType: string;
  let kind: 'image' | 'file';
  let width: number | null = null;
  let height: number | null = null;

  if (file.type === 'application/pdf') {
    kind = 'file';
    path = `files/${id}-${slugifyName(file.name) || 'file'}.pdf`;
    body = file;
    contentType = file.type;
  } else if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    kind = 'image';
    path = `${dir}/${id}.${file.type === 'image/gif' ? 'gif' : 'svg'}`;
    body = file;
    contentType = file.type;
    ({ width, height } = await svgOrGifSize(file));
  } else {
    kind = 'image';
    const out = await toWebp(file);
    path = `${dir}/${id}.webp`;
    body = out.blob;
    contentType = 'image/webp';
    width = out.width;
    height = out.height;
  }
  if (body.size > MAX_BYTES) throw new Error(`${file.name}: larger than 10 MB after processing`);

  const { error } = await createBrowserSupabase().storage.from(MEDIA_BUCKET).upload(path, body, { contentType });
  if (error) throw new Error(`${file.name}: upload failed (${error.message})`);

  const result = await registerMedia({ path, kind, alt, width, height, bytes: body.size });
  if (!result.ok) {
    await createBrowserSupabase().storage.from(MEDIA_BUCKET).remove([path]);
    throw new Error(`${file.name}: couldn't save (${result.error})`);
  }
  return result.data;
}

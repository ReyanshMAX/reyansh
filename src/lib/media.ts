// Placeholder media id for a new Photo tile until a photo is picked (D-023).
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const MEDIA_BUCKET = 'media';

export interface MediaItem {
  id: string;
  path: string;                 // object key in bucket 'media'
  kind: 'image' | 'file';
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number;
  createdAt: string;
  url: string;                  // public URL
}

export interface MediaRow {
  id: string;
  path: string;
  kind: 'image' | 'file';
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number;
  created_at: string;
}

export const MEDIA_COLUMNS = 'id, path, kind, alt, width, height, bytes, created_at';

export function mediaUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

export function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    path: row.path,
    kind: row.kind,
    alt: row.alt,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    createdAt: row.created_at,
    url: mediaUrl(row.path),
  };
}

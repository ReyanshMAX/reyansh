import 'server-only';
import { tileSchema } from '@/lib/schemas';
import { createPublicClient } from '@/lib/supabase/public';
import type { PageSlug, Tile } from '@/lib/tiles';
import { TILE_REGISTRY } from '@/tiles/registry';

export type { PageSlug } from '@/lib/tiles';

export interface SiteSettings {
  nowText: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  resumePath: string | null;
}

const EMPTY_SETTINGS: SiteSettings = { nowText: '', email: '', githubUrl: '', linkedinUrl: '', resumePath: null };

// Keeps only tiles that parse and whose type is registered, so a bad row can
// never take the public page down.
export function sanitizeTiles(raw: unknown): Tile[] {
  if (!Array.isArray(raw)) return [];
  const tiles: Tile[] = [];
  for (const item of raw) {
    const parsed = tileSchema.safeParse(item);
    if (parsed.success && TILE_REGISTRY[parsed.data.type]) tiles.push(parsed.data as Tile);
  }
  return tiles;
}

// Public pages must build and render with an empty or unreachable database:
// every query degrades to an empty result instead of throwing.
export async function getPublishedLayout(page: PageSlug): Promise<Tile[]> {
  try {
    const { data, error } = await createPublicClient()
      .from('layouts')
      .select('tiles')
      .eq('page_slug', page)
      .eq('status', 'published')
      .maybeSingle();
    if (error) throw error;
    return sanitizeTiles(data?.tiles);
  } catch (e) {
    console.error(`getPublishedLayout(${page}) failed`, e);
    return [];
  }
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await createPublicClient()
      .from('site_settings')
      .select('now_text, email, github_url, linkedin_url, resume_path')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return EMPTY_SETTINGS;
    return {
      nowText: data.now_text,
      email: data.email,
      githubUrl: data.github_url,
      linkedinUrl: data.linkedin_url,
      resumePath: data.resume_path,
    };
  } catch (e) {
    console.error('getSettings failed', e);
    return EMPTY_SETTINGS;
  }
}

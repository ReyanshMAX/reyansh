'use server';

import { revalidatePath } from 'next/cache';
import { pageSlugSchema } from '@/lib/schemas';
import { createServerSupabase } from '@/lib/supabase/server';
import { pagePath, type PageSlug, type Tile } from '@/lib/tiles';
import { findMissingRefs, validateLayout } from '@/tiles/validate';
import { requireOwner } from './auth';
import { sanitizeTiles } from './queries';
import { ActionError, fail, ok, runAction, type ActionResult } from './result';

function parsePage(page: unknown): PageSlug {
  const parsed = pageSlugSchema.safeParse(page);
  if (!parsed.success) throw new ActionError('invalid_page');
  return parsed.data;
}

export async function getDraftLayout(
  page: PageSlug,
): Promise<ActionResult<{ tiles: Tile[]; updatedAt: string; publishedAt: string | null }>> {
  return runAction(async () => {
    await requireOwner();
    const slug = parsePage(page);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('layouts')
      .select('status, tiles, updated_at, published_at')
      .eq('page_slug', slug);
    if (error) throw error;
    const draft = data?.find((r) => r.status === 'draft');
    const published = data?.find((r) => r.status === 'published');
    if (!draft) return fail('not_found');
    return ok({
      tiles: sanitizeTiles(draft.tiles),
      updatedAt: draft.updated_at as string,
      publishedAt: (published?.published_at as string | null) ?? null,
    });
  });
}

export async function saveDraftLayout(page: PageSlug, tiles: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return runAction(async () => {
    await requireOwner();
    const slug = parsePage(page);
    const result = validateLayout(tiles);
    if (!result.ok) return fail('invalid_layout', result.errors);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('layouts')
      .update({ tiles: result.tiles })
      .eq('page_slug', slug)
      .eq('status', 'draft')
      .select('updated_at')
      .single();
    if (error) throw error;
    return ok({ updatedAt: data.updated_at as string });
  });
}

async function existingRefs(tiles: Tile[]): Promise<{ projectIds: Set<string>; mediaIds: Set<string> }> {
  const projectIds = new Set<string>();
  const mediaIds = new Set<string>();
  const wantProjects = tiles.filter((t) => t.type === 'project').map((t) => (t as Tile<'project'>).config.projectId);
  const wantMedia = tiles.filter((t) => t.type === 'media').map((t) => (t as Tile<'media'>).config.mediaId);
  // projects / media tables arrive in later migrations; only query when a tile needs them.
  if (wantProjects.length || wantMedia.length) {
    const supabase = await createServerSupabase();
    if (wantProjects.length) {
      const { data, error } = await supabase.from('projects').select('id').eq('published', true).in('id', wantProjects);
      if (error) throw error;
      for (const r of data ?? []) projectIds.add(r.id as string);
    }
    if (wantMedia.length) {
      const { data, error } = await supabase.from('media').select('id').in('id', wantMedia);
      if (error) throw error;
      for (const r of data ?? []) mediaIds.add(r.id as string);
    }
  }
  return { projectIds, mediaIds };
}

export async function publishLayout(page: PageSlug): Promise<ActionResult<{ publishedAt: string }>> {
  return runAction(async () => {
    await requireOwner();
    const slug = parsePage(page);
    const supabase = await createServerSupabase();
    const { data: draft, error: readError } = await supabase
      .from('layouts')
      .select('tiles')
      .eq('page_slug', slug)
      .eq('status', 'draft')
      .single();
    if (readError) throw readError;

    const result = validateLayout(draft.tiles);
    if (!result.ok) return fail('invalid_layout', result.errors);
    const refErrors = findMissingRefs(result.tiles, await existingRefs(result.tiles));
    if (refErrors.length) return fail('invalid_layout', refErrors);

    const publishedAt = new Date().toISOString();
    const { error } = await supabase
      .from('layouts')
      .update({ tiles: result.tiles, published_at: publishedAt })
      .eq('page_slug', slug)
      .eq('status', 'published')
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath(pagePath(slug));
    return ok({ publishedAt });
  });
}

export async function discardDraft(page: PageSlug): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    const slug = parsePage(page);
    const supabase = await createServerSupabase();
    const { data: published, error: readError } = await supabase
      .from('layouts')
      .select('tiles')
      .eq('page_slug', slug)
      .eq('status', 'published')
      .single();
    if (readError) throw readError;
    const { error } = await supabase
      .from('layouts')
      .update({ tiles: published.tiles })
      .eq('page_slug', slug)
      .eq('status', 'draft')
      .select('id')
      .single();
    if (error) throw error;
    return ok();
  });
}

'use server';

import { revalidatePath } from 'next/cache';
import { MEDIA_BUCKET, MEDIA_COLUMNS, toMediaItem, type MediaItem, type MediaRow } from '@/lib/media';
import { mediaInput } from '@/lib/schemas';
import { createServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireOwner } from './auth';
import { fail, ok, runAction, type ActionResult } from './result';

const idSchema = z.string().uuid();
const PAGE_LABEL: Record<string, string> = { home: 'Home', about: 'About' };

export async function registerMedia(input: {
  path: string; kind: 'image' | 'file'; alt: string; width: number | null; height: number | null; bytes: number;
}): Promise<ActionResult<MediaItem>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = mediaInput.safeParse(input);
    if (!parsed.success) return fail('invalid_input', parsed.error.issues);
    const v = parsed.data;
    if ((v.kind === 'file') !== v.path.startsWith('files/')) return fail('invalid_input');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('media').insert(v).select(MEDIA_COLUMNS).single();
    if (error) throw error;
    return ok(toMediaItem(data as MediaRow));
  });
}

export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    const parsed = z.object({ id: idSchema, alt: z.string().trim().max(300) }).safeParse({ id, alt });
    if (!parsed.success) return fail('invalid_input', parsed.error.issues);
    const supabase = await createServerSupabase();
    const { error } = await supabase.from('media').update({ alt: parsed.data.alt }).eq('id', parsed.data.id).select('id').single();
    if (error) throw error;
    revalidatePath('/', 'layout');
    return ok();
  });
}

// Refused while any layout tile (draft or published) or the résumé setting uses it (D-025).
export async function deleteMedia(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) return fail('invalid_input');
    const supabase = await createServerSupabase();

    const { data: item, error: readError } = await supabase.from('media').select('id, path').eq('id', parsed.data).single();
    if (readError) throw readError;

    const [{ data: layouts, error: layoutError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('layouts').select('page_slug, status, tiles'),
      supabase.from('site_settings').select('resume_path').eq('id', 1).maybeSingle(),
    ]);
    if (layoutError) throw layoutError;
    if (settingsError) throw settingsError;

    const usedIn: string[] = [];
    for (const l of layouts ?? []) {
      if (JSON.stringify(l.tiles).includes(item.id)) usedIn.push(`${PAGE_LABEL[l.page_slug] ?? l.page_slug} (${l.status})`);
    }
    if (settings?.resume_path === item.path) usedIn.push('Settings (résumé)');
    if (usedIn.length) return fail(`Used in: ${usedIn.join(', ')}`, { usedIn });

    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([item.path]);
    if (storageError) throw storageError;
    const { error } = await supabase.from('media').delete().eq('id', item.id);
    if (error) throw error;
    return ok();
  });
}

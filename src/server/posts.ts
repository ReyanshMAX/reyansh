'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { POST_COLUMNS, toPostRow, type PostDbRow, type PostRow } from '@/lib/posts';
import { postInput, type PostInput } from '@/lib/schemas';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireOwner } from './auth';
import { fail, ok, runAction, type ActionResult } from './result';

const idSchema = z.string().uuid();

// Any write that affects a live or scheduled post (docs/ARCHITECTURE.md revalidation map).
function revalidatePost(...slugs: (string | null | undefined)[]) {
  revalidatePath('/blog');
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/blog/${s}`);
  revalidatePath('/');
  revalidatePath('/about');
}

// Newest first: drafts by last edit, the rest by publish date (the editor groups them).
export async function listAllPosts(): Promise<ActionResult<PostRow[]>> {
  return runAction(async () => {
    await requireOwner();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').select(POST_COLUMNS).order('updated_at', { ascending: false });
    if (error) throw error;
    return ok((data as unknown as PostDbRow[]).map(toPostRow));
  });
}

export async function getPost(id: string): Promise<ActionResult<PostRow>> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('not_found');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').select(POST_COLUMNS).eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return fail('not_found');
    return ok(toPostRow(data as unknown as PostDbRow));
  });
}

// Upsert by id; 'slug_taken' on conflict.
export async function savePost(input: PostInput): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = postInput.safeParse(input);
    if (!parsed.success) return fail('invalid_input', parsed.error.issues);
    const v = parsed.data;
    const supabase = await createServerSupabase();
    const row = {
      slug: v.slug, title: v.title, excerpt: v.excerpt, category: v.category,
      related_project_id: v.relatedProjectId, cover_media_id: v.coverMediaId,
      body_md: v.bodyMd, show_in_feed: v.showInFeed,
    };

    if (!v.id) {
      const { data, error } = await supabase.from('posts').insert(row).select('id, updated_at').single();
      if (error) return error.code === '23505' ? fail('slug_taken') : Promise.reject(error);
      return ok({ id: data.id as string, updatedAt: data.updated_at as string });
    }

    const { data: before, error: readError } = await supabase.from('posts').select('slug, published_at').eq('id', v.id).single();
    if (readError) throw readError;
    const { data, error } = await supabase.from('posts').update(row).eq('id', v.id).select('id, updated_at').single();
    if (error) return error.code === '23505' ? fail('slug_taken') : Promise.reject(error);
    if (before.published_at) revalidatePost(v.slug, before.slug as string);
    return ok({ id: data.id as string, updatedAt: data.updated_at as string });
  });
}

// at: null = now; a future ISO timestamp = scheduled.
export async function publishPost(id: string, at: string | null): Promise<ActionResult<{ publishedAt: string }>> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('invalid_input');
    let publishedAt = new Date().toISOString();
    if (at !== null) {
      const parsed = z.string().datetime({ offset: true }).safeParse(at);
      if (!parsed.success || new Date(parsed.data).getTime() <= Date.now()) return fail('invalid_input');
      publishedAt = new Date(parsed.data).toISOString();
    }
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').update({ published_at: publishedAt }).eq('id', id).select('slug').single();
    if (error) throw error;
    revalidatePost(data.slug as string);
    return ok({ publishedAt });
  });
}

export async function unpublishPost(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('invalid_input');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').update({ published_at: null }).eq('id', id).select('slug').single();
    if (error) throw error;
    revalidatePost(data.slug as string);
    return ok();
  });
}

export async function deletePost(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('invalid_input');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('posts').delete().eq('id', id).select('slug, published_at').single();
    if (error) throw error;
    if (data.published_at) revalidatePost(data.slug as string);
    return ok();
  });
}

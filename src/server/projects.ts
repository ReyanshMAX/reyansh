'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PROJECT_COLUMNS, toProjectRow, type ProjectDbRow, type ProjectRow } from '@/lib/projects';
import { projectInput, type ProjectInput } from '@/lib/schemas';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireOwner } from './auth';
import { fail, ok, runAction, type ActionResult } from './result';

const idSchema = z.string().uuid();
const PAGE_LABEL: Record<string, string> = { home: 'Home', about: 'About' };

// Any write that affects a published project (docs/ARCHITECTURE.md revalidation map).
function revalidateProject(...slugs: (string | null | undefined)[]) {
  revalidatePath('/projects');
  for (const s of new Set(slugs.filter(Boolean))) revalidatePath(`/projects/${s}`);
  revalidatePath('/');
  revalidatePath('/about');
}

export async function listAllProjects(): Promise<ActionResult<ProjectRow[]>> {
  return runAction(async () => {
    await requireOwner();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('projects').select(PROJECT_COLUMNS).order('sort_order', { ascending: true });
    if (error) throw error;
    return ok((data as unknown as ProjectDbRow[]).map(toProjectRow));
  });
}

export async function getProject(id: string): Promise<ActionResult<ProjectRow>> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('not_found');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('projects').select(PROJECT_COLUMNS).eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return fail('not_found');
    return ok(toProjectRow(data as unknown as ProjectDbRow));
  });
}

// Upsert by id. New projects go to the end of the order.
export async function saveProject(input: ProjectInput): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  return runAction(async () => {
    await requireOwner();
    const parsed = projectInput.safeParse(input);
    if (!parsed.success) return fail('invalid_input', parsed.error.issues);
    const v = parsed.data;
    const supabase = await createServerSupabase();
    const row = {
      slug: v.slug, title: v.title, one_liner: v.oneLiner, category: v.category, year: v.year, role: v.role,
      stack: v.stack, status: v.status, github_url: v.githubUrl, demo_url: v.demoUrl,
      cover_media_id: v.coverMediaId, video_url: v.videoUrl, body_md: v.bodyMd,
    };

    if (!v.id) {
      const { data: last } = await supabase.from('projects').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...row, sort_order: (last?.sort_order ?? -1) + 1 })
        .select('id, updated_at')
        .single();
      if (error) return error.code === '23505' ? fail('slug_taken') : Promise.reject(error);
      return ok({ id: data.id as string, updatedAt: data.updated_at as string });
    }

    const { data: before, error: readError } = await supabase.from('projects').select('slug, published').eq('id', v.id).single();
    if (readError) throw readError;
    const { data, error } = await supabase.from('projects').update(row).eq('id', v.id).select('id, updated_at').single();
    if (error) return error.code === '23505' ? fail('slug_taken') : Promise.reject(error);
    if (before.published) revalidateProject(v.slug, before.slug as string);
    return ok({ id: data.id as string, updatedAt: data.updated_at as string });
  });
}

export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success || typeof published !== 'boolean') return fail('invalid_input');
    const supabase = await createServerSupabase();
    const { data: before, error: readError } = await supabase.from('projects').select('slug, published_at').eq('id', id).single();
    if (readError) throw readError;
    // published_at is set the first time a project is published and never cleared (docs/DATABASE.md).
    const patch: Record<string, unknown> = { published };
    if (published && !before.published_at) patch.published_at = new Date().toISOString();
    const { error } = await supabase.from('projects').update(patch).eq('id', id).select('id').single();
    if (error) throw error;
    revalidateProject(before.slug as string);
    return ok();
  });
}

export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success || typeof featured !== 'boolean') return fail('invalid_input');
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from('projects').update({ featured }).eq('id', id).select('slug, published').single();
    if (error) throw error;
    if (data.published) revalidateProject(data.slug as string);
    return ok();
  });
}

// sort_order = index
export async function reorderProjects(orderedIds: string[]): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    const parsed = z.array(idSchema).max(500).safeParse(orderedIds);
    if (!parsed.success) return fail('invalid_input');
    const supabase = await createServerSupabase();
    const results = await Promise.all(
      parsed.data.map((id, i) => supabase.from('projects').update({ sort_order: i }).eq('id', id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
    revalidateProject();
    return ok();
  });
}

// Refused while a layout tile (draft or published) references the project.
export async function deleteProject(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    if (!idSchema.safeParse(id).success) return fail('invalid_input');
    const supabase = await createServerSupabase();
    const [{ data: project, error: readError }, { data: layouts, error: layoutError }] = await Promise.all([
      supabase.from('projects').select('slug, published').eq('id', id).single(),
      supabase.from('layouts').select('page_slug, status, tiles'),
    ]);
    if (readError) throw readError;
    if (layoutError) throw layoutError;
    const usedIn = (layouts ?? [])
      .filter((l) => JSON.stringify(l.tiles).includes(id))
      .map((l) => `${PAGE_LABEL[l.page_slug] ?? l.page_slug} (${l.status})`);
    if (usedIn.length) return fail(`Used in: ${usedIn.join(', ')}`, { usedIn });
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    if (project.published) revalidateProject(project.slug as string);
    return ok();
  });
}

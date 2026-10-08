'use server';

import { revalidatePath } from 'next/cache';
import { settingsInput, type SettingsInput } from '@/lib/schemas';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireOwner } from './auth';
import { fail, ok, runAction, type ActionResult } from './result';

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireOwner();
    const parsed = settingsInput.safeParse(input);
    if (!parsed.success) return fail('invalid_input', parsed.error.issues);
    const v = parsed.data;
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from('site_settings')
      .update({
        now_text: v.nowText,
        email: v.email,
        github_url: v.githubUrl,
        linkedin_url: v.linkedinUrl,
        resume_path: v.resumePath,
      })
      .eq('id', 1)
      .select('id')
      .single();
    if (error) throw error;
    revalidatePath('/', 'layout');
    return ok();
  });
}

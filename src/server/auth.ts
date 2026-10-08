import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { ActionError } from './result';

// Re-checked inside every server action (the proxy only gates page requests).
export async function requireOwner(): Promise<{ userId: string }> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new ActionError('unauthorized');
  const { data, error } = await supabase.from('app_owner').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error || !data) throw new ActionError('unauthorized');
  return { userId: user.id };
}

export async function signOut(): Promise<void> {
  'use server';
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

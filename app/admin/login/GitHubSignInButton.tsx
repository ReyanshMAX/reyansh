'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export function GitHubSignInButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/admin` },
    });
    if (error) {
      setPending(false);
      router.push('/admin/login?error=oauth');
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className="flex min-h-14 w-full items-center justify-center rounded-pill bg-ink text-[17px] font-bold text-cream disabled:opacity-60"
    >
      {pending ? 'Redirecting…' : 'Continue with GitHub'}
    </button>
  );
}

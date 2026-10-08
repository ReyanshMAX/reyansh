import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Only same-site absolute paths are allowed as the post-login destination.
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code');
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  if (!code) return NextResponse.redirect(new URL('/admin/login?error=oauth', req.url));

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/admin/login?error=oauth', req.url));
  return NextResponse.redirect(new URL(next, req.url));
}

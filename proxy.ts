import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Gates every /admin route except /admin/login (docs/AUTH.md).
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Redirects must carry any refreshed/cleared auth cookies.
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectTo('/admin/login');

  const { data: owner } = await supabase.from('app_owner').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!owner) {
    await supabase.auth.signOut();
    return redirectTo('/admin/login?error=not_owner');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};

import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { error } = await createPublicClient().from('site_settings').select('id').limit(1);
    if (error) throw error;
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : 'unknown';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

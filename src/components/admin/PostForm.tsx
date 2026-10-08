'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BlogPost } from '@/components/site/BlogPost';
import { BLOG_CATEGORIES } from '@/lib/categories';
import type { TocEntry } from '@/lib/markdown';
import { postState, readMinutesOf, type PostRow, type PostState } from '@/lib/posts';
import { postInput, type PostInput } from '@/lib/schemas';
import { slugify } from '@/lib/slug';
import { renderPostPreview } from '@/server/markdown';
import { deletePost, publishPost, savePost, unpublishPost } from '@/server/posts';
import { useAdminData } from './AdminData';
import { MediaPicker } from './MediaPicker';
import { nextToastId, Toast, type ToastMessage } from './Toast';
import { uploadMedia } from './upload';

// CodeMirror is browser-only.
const MarkdownEditor = dynamic(() => import('./MarkdownEditor').then((m) => m.MarkdownEditor), {
  ssr: false,
  loading: () => <div className="min-h-[480px] rounded-2xl border-[1.5px] border-admin-line bg-white" />,
});

const AUTOSAVE_MS = 1500;
const STATE_LABEL: Record<PostState, string> = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published' };
const STATE_BG: Record<PostState, string> = { draft: 'bg-admin-line', scheduled: 'bg-yellow', published: 'bg-green' };

type Form = {
  title: string; slug: string; excerpt: string; category: string; relatedProjectId: string | null;
  coverMediaId: string | null; bodyMd: string; showInFeed: boolean;
};

function toForm(p: PostRow | null): Form {
  return {
    title: p?.title ?? '', slug: p?.slug ?? '', excerpt: p?.excerpt ?? '', category: p?.category ?? BLOG_CATEGORIES[0][0],
    relatedProjectId: p?.relatedProjectId ?? null, coverMediaId: p?.coverMediaId ?? null, bodyMd: p?.bodyMd ?? '',
    showInFeed: p?.showInFeed ?? true,
  };
}

function toInput(f: Form, id: string | null): PostInput {
  return {
    ...(id ? { id } : {}),
    slug: f.slug, title: f.title, excerpt: f.excerpt, category: f.category as PostInput['category'],
    relatedProjectId: f.relatedProjectId, coverMediaId: f.coverMediaId, bodyMd: f.bodyMd, showInFeed: f.showInFeed,
  };
}

// <input type="datetime-local"> works in the browser's local time.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function relative(iso: string, now: number): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Wall clock for state badges and relative times; null until mounted (no SSR mismatch).
function useNow(): [number | null, () => void] {
  const [now, setNow] = useState<number | null>(null);
  const tick = useCallback(() => setNow(Date.now()), []);
  useEffect(() => {
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [tick]);
  return [now, tick];
}

function Input({ label, value, onChange, max, error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; max?: number; error?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="admin-label">{label}</span>
      <input className={`admin-input ${error ? 'border-orange' : ''}`} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="text-[13px] text-orange">{error}</span>}
    </label>
  );
}

function PostList({ posts, currentId, now }: { posts: PostRow[]; currentId: string | null; now: number | null }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? posts.filter((p) => p.title.toLowerCase().includes(q)) : posts;
  const groups: { state: PostState; label: string; items: PostRow[]; meta: (p: PostRow) => string }[] = [
    {
      state: 'draft', label: 'Drafts',
      items: shown.filter((p) => !p.publishedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      meta: (p) => (now ? `Edited ${relative(p.updatedAt, now)}` : ''),
    },
    {
      state: 'scheduled', label: 'Scheduled',
      items: now ? shown.filter((p) => p.publishedAt && postState(p.publishedAt, now) === 'scheduled').sort((a, b) => a.publishedAt!.localeCompare(b.publishedAt!)) : [],
      meta: (p) => formatDateTime(p.publishedAt!),
    },
    {
      state: 'published', label: 'Published',
      items: now ? shown.filter((p) => p.publishedAt && postState(p.publishedAt, now) === 'published').sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!)) : [],
      meta: (p) => relative(p.publishedAt!, now ?? 0),
    },
  ];
  return (
    <aside className="flex flex-col gap-4 border-r-[1.5px] border-admin-line bg-admin-panel p-4">
      <Link href="/admin/posts/new" className="admin-btn admin-btn-accent justify-center">+ New post</Link>
      <input className="admin-input" type="search" placeholder="Search posts" aria-label="Search posts" value={query} onChange={(e) => setQuery(e.target.value)} />
      {groups.map((g) => g.items.length > 0 && (
        <section key={g.state} className="flex flex-col gap-1">
          <h2 className="admin-label px-2 py-1">{g.label}</h2>
          {g.items.map((p) => (
            <Link
              key={p.id}
              href={`/admin/posts/${p.id}`}
              aria-current={p.id === currentId ? 'page' : undefined}
              className={`flex min-h-11 flex-col justify-center rounded-xl px-3 py-2 ${p.id === currentId ? 'bg-white outline-[1.5px] outline-admin-line outline' : ''}`}
            >
              <span className="truncate font-bold">{p.title || 'Untitled'}</span>
              <span className="text-[13px] text-admin-muted">{g.meta(p)}</span>
            </Link>
          ))}
        </section>
      ))}
      {posts.length === 0 && <p className="px-2 text-[14px] text-admin-muted">No posts yet.</p>}
    </aside>
  );
}

// docs/DASHBOARD.md "Posts". Autosave only while a draft; a scheduled or published post
// changes only on Update (same rule as projects, D-012).
export function PostForm({ post, posts }: { post: PostRow | null; posts: PostRow[] }) {
  const router = useRouter();
  const { upsertMedia, mediaById, projects } = useAdminData();
  const [now, tickNow] = useNow();
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [form, setForm] = useState<Form>(() => toForm(post));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [publishedAt, setPublishedAt] = useState<string | null>(post?.publishedAt ?? null);
  const [dateInput, setDateInput] = useState(() => toLocalInput(post?.publishedAt ?? null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(post?.updatedAt ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ html: string; toc: TocEntry[] } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(form);
  useEffect(() => {
    latest.current = form;
  }, [form]);

  const state: PostState = publishedAt ? (now ? postState(publishedAt, now) : 'published') : 'draft';
  const isDraft = state === 'draft';
  const dateIso = dateInput ? new Date(dateInput).toISOString() : null;
  const dateInFuture = Boolean(dateIso && now && new Date(dateIso).getTime() > now);
  const dateChanged = state === 'scheduled' && dateInput !== toLocalInput(publishedAt);

  const parsed = postInput.safeParse(toInput(form, id));
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;

  // Returns the post id on success, null on failure.
  const save = useCallback(async (): Promise<string | null> => {
    const check = postInput.safeParse(toInput(latest.current, id));
    if (!check.success) {
      setSaveError('Fix the highlighted fields to save');
      return null;
    }
    setSaving(true);
    const result = await savePost(check.data);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error === 'slug_taken' ? 'That slug is already used by another post' : `Couldn't save (${result.error})`);
      return null;
    }
    setSaveError(null);
    setDirty(false);
    setSavedAt(result.data.updatedAt);
    if (!id) {
      setId(result.data.id);
      // Update the URL without remounting the form (Next syncs history.replaceState).
      window.history.replaceState(null, '', `/admin/posts/${result.data.id}`);
    }
    return result.data.id;
  }, [id]);

  function update(patch: Partial<Form>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (patch.title !== undefined && !slugTouched) next.slug = slugify(patch.title).slice(0, 80).replace(/-+$/, '');
      return next;
    });
    setDirty(true);
  }

  // Autosave while a draft (debounce 1500ms).
  useEffect(() => {
    if (!dirty || !isDraft) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, dirty, isDraft, save]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  const viewLink = (slug: string) => <a className="underline" href={`/blog/${slug}`} target="_blank" rel="noreferrer">View ↗</a>;

  // at: null = now, ISO = scheduled. Saves pending edits first.
  const publish = (at: string | null) => run(at ? 'schedule' : 'publish', async () => {
    const target = dirty || !id ? await save() : id;
    if (!target) return;
    const r = await publishPost(target, at);
    if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Couldn't ${at ? 'schedule' : 'publish'} (${r.error}).` });
    setPublishedAt(r.data.publishedAt);
    setDateInput(toLocalInput(r.data.publishedAt));
    tickNow();
    router.refresh();
    setToast({
      id: nextToastId(), tone: 'info',
      body: at ? `Scheduled for ${formatDateTime(r.data.publishedAt)}.` : <span>Published. {viewLink(form.slug)}</span>,
    });
  });

  // Scheduled/published: save edits, and move a scheduled post's date if it changed.
  const updateLive = () => run('update', async () => {
    if (dirty && !(await save())) return;
    if (id && dateChanged && dateIso) {
      if (!dateInFuture) return setToast({ id: nextToastId(), tone: 'error', body: 'Pick a future date, or use Publish now.' });
      const r = await publishPost(id, dateIso);
      if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Couldn't reschedule (${r.error}).` });
      setPublishedAt(r.data.publishedAt);
    }
    router.refresh();
    setToast({ id: nextToastId(), tone: 'info', body: state === 'published' ? 'Live post updated.' : 'Scheduled post updated.' });
  });

  const unpublish = () => run('unpublish', async () => {
    if (!id || !window.confirm(state === 'published' ? 'Unpublish? The post disappears from the live site.' : 'Cancel the schedule and move this post back to drafts?')) return;
    const r = await unpublishPost(id);
    if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Couldn't unpublish (${r.error}).` });
    setPublishedAt(null);
    setDateInput('');
    router.refresh();
    setToast({ id: nextToastId(), tone: 'info', body: 'Moved back to drafts.' });
  });

  const remove = () => run('delete', async () => {
    if (!id) return router.push('/admin/posts');
    if (!window.confirm('Delete this post permanently?')) return;
    const r = await deletePost(id);
    if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Delete failed (${r.error}).` });
    setDirty(false);
    router.push('/admin/posts');
    router.refresh();
  });

  async function uploadInline(file: File) {
    const alt = window.prompt('Alt text for this image (required):')?.trim();
    if (!alt) throw new Error('Alt text is required to insert an image.');
    const item = await uploadMedia(file, alt);
    upsertMedia(item);
    return { url: item.url, alt };
  }

  // Left pane shows this post's unsaved title/state too.
  const self: PostRow | null = id
    ? {
      ...(posts.find((p) => p.id === id) ?? post ?? ({} as PostRow)),
      id, title: form.title, slug: form.slug, publishedAt, updatedAt: savedAt ?? new Date(0).toISOString(),
    }
    : null;
  const listed = self ? [self, ...posts.filter((p) => p.id !== id)] : posts;

  const cover = form.coverMediaId ? mediaById.get(form.coverMediaId) : undefined;
  const related = form.relatedProjectId ? projects.find((p) => p.id === form.relatedProjectId) : undefined;

  const status = !isDraft
    ? (dirty || dateChanged ? 'Unsaved changes' : state === 'scheduled' ? `Goes live ${formatDateTime(publishedAt!)}` : 'Live')
    : saving ? 'Saving…' : saveError ?? (dirty ? 'Unsaved changes' : savedAt ? `Autosaved · ${formatTime(savedAt)}` : 'Not saved yet');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[1.5px] border-admin-line bg-admin-panel px-6">
        <div className="flex min-w-0 items-center gap-3 text-[15px]">
          <span className="text-admin-muted">Dashboard / Blog posts</span>
          <span className="text-admin-muted">/</span>
          <span className="truncate font-bold">{form.title || 'New post'}</span>
          <span className={`rounded-pill px-2.5 py-0.5 text-[12px] font-bold ${STATE_BG[state]}`}>{STATE_LABEL[state]}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[14px] ${saveError ? 'text-orange' : 'text-admin-muted'}`} aria-live="polite">{status}</span>
          <button type="button" className="admin-btn" onClick={() => void renderPostPreview(form.bodyMd).then(setPreview)}>Preview</button>
          {isDraft ? (
            <>
              <button type="button" className="admin-btn" onClick={() => void publish(dateIso)} disabled={busy !== null || !dateInFuture} title={dateInFuture ? undefined : 'Pick a future publish date first'}>
                {busy === 'schedule' ? 'Scheduling…' : 'Schedule'}
              </button>
              <button type="button" className="admin-btn admin-btn-accent" onClick={() => void publish(null)} disabled={busy !== null}>
                {busy === 'publish' ? 'Publishing…' : 'Publish'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="admin-btn" onClick={() => void unpublish()} disabled={busy !== null}>Unpublish</button>
              {state === 'scheduled' && (
                <button type="button" className="admin-btn" onClick={() => void publish(null)} disabled={busy !== null}>Publish now</button>
              )}
              <button
                type="button"
                className="admin-btn admin-btn-accent"
                onClick={() => void updateLive()}
                disabled={busy !== null || !(dirty || dateChanged)}
              >
                {busy === 'update' ? 'Updating…' : 'Update'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[340px_minmax(0,1fr)_360px]">
        <PostList posts={listed} currentId={id} now={now} />

        <div className="flex min-w-0 flex-col gap-5 p-6">
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Title</span>
            <input
              className={`h-16 w-full rounded-xl border-[1.5px] bg-white px-4 text-[32px] font-extrabold tracking-[-0.02em] ${form.title || !id ? 'border-admin-line' : 'border-orange'}`}
              value={form.title}
              maxLength={120}
              placeholder="Post title"
              onChange={(e) => update({ title: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Excerpt</span>
            <input className="admin-input text-[18px]" value={form.excerpt} maxLength={240} placeholder="Subtitle / excerpt…" onChange={(e) => update({ excerpt: e.target.value })} />
            <span className="self-end font-mono text-xs text-admin-muted">{form.excerpt.length}/240</span>
          </label>
          <MarkdownEditor value={form.bodyMd} onChange={(bodyMd) => update({ bodyMd })} onUploadImage={uploadInline} />
        </div>

        <aside className="flex flex-col gap-5 border-l-[1.5px] border-admin-line bg-admin-panel p-5">
          <h2 className="text-[17px] font-bold">Post settings</h2>
          <Input
            label="Slug"
            value={form.slug}
            max={80}
            onChange={(v) => { setSlugTouched(true); update({ slug: v.toLowerCase() }); }}
            error={form.slug ? errors.slug && 'Lowercase letters, numbers and single hyphens' : undefined}
          />
          <label className="flex flex-col gap-1.5">
            <span className="admin-label">Category</span>
            <select className="admin-input" value={form.category} onChange={(e) => update({ category: e.target.value })}>
              {BLOG_CATEGORIES.map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="admin-label">Related project</span>
            <select className="admin-input" value={form.relatedProjectId ?? ''} onChange={(e) => update({ relatedProjectId: e.target.value || null })}>
              <option value="">None</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}{p.published ? '' : ' (draft)'}</option>)}
            </select>
            {related && !related.published && <span className="text-[13px] text-admin-muted">Shown on the post once the project is published.</span>}
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="admin-label">Cover image (optional)</span>
            <MediaPicker kind="image" value={form.coverMediaId} onChange={(coverMediaId) => update({ coverMediaId })} />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="admin-label">Publish date</span>
            <input
              className="admin-input"
              type="datetime-local"
              value={dateInput}
              disabled={state === 'published'}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <span className="text-[13px] text-admin-muted">
              {state === 'published' ? 'Already live.' : 'A future date enables Schedule. Your local time.'}
            </span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5" checked={form.showInFeed} onChange={(e) => update({ showInFeed: e.target.checked })} />
            <span className="font-medium">Show in Home blog feed</span>
          </label>
          <button type="button" className="admin-btn mt-auto self-start" onClick={() => void remove()} disabled={busy !== null}>Delete post</button>
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-6" onClick={() => setPreview(null)}>
          <div role="dialog" aria-modal="true" aria-label="Post preview" className="mx-auto max-w-[1600px] rounded-[28px] bg-cream p-8 text-ink" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="t-meta">Preview{state === 'published' ? '' : ' — not live'}</span>
              <button type="button" className="admin-btn" onClick={() => setPreview(null)}>Close</button>
            </div>
            <BlogPost
              post={{
                slug: form.slug || 'preview', title: form.title || 'Untitled', excerpt: form.excerpt, category: form.category,
                publishedAt: publishedAt ?? '', readMinutes: readMinutesOf(form.bodyMd), coverUrl: cover?.url ?? null, coverAlt: cover?.alt ?? '',
                bodyMd: form.bodyMd, relatedProject: related ? { slug: related.slug, title: related.title } : null,
                nextSlug: null, nextTitle: null, nextPublishedAt: null, nextReadMinutes: null,
              }}
              bodyHtml={preview.html}
              toc={preview.toc}
            />
          </div>
        </div>
      )}
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}

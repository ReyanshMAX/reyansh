'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectDetail } from '@/components/site/ProjectDetail';
import { TileShell } from '@/components/site/TileShell';
import { PROJECT_CATEGORIES } from '@/lib/categories';
import { PROJECT_STATUS_LABEL, type ProjectRow, type ProjectStatus } from '@/lib/projects';
import { projectInput, type ProjectInput } from '@/lib/schemas';
import { slugify } from '@/lib/slug';
import { TILE_COLORS, type Tile, type TileColor } from '@/lib/tiles';
import { TILE_STYLE } from '@/lib/tokens';
import { renderMarkdownPreview } from '@/server/markdown';
import { deleteProject, saveProject, setProjectFeatured, setProjectPublished } from '@/server/projects';
import { ProjectRender } from '@/tiles/project/Render';
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

type Form = {
  title: string; slug: string; oneLiner: string; category: string; year: string; role: string;
  stack: string[]; status: ProjectStatus; githubUrl: string; demoUrl: string; videoUrl: string;
  coverMediaId: string | null; bodyMd: string;
};

function toForm(p: ProjectRow | null): Form {
  return {
    title: p?.title ?? '', slug: p?.slug ?? '', oneLiner: p?.oneLiner ?? '', category: p?.category ?? PROJECT_CATEGORIES[0][0],
    year: p?.year ? String(p.year) : '', role: p?.role ?? '', stack: p?.stack ?? [], status: p?.status ?? 'in_progress',
    githubUrl: p?.githubUrl ?? '', demoUrl: p?.demoUrl ?? '', videoUrl: p?.videoUrl ?? '',
    coverMediaId: p?.coverMediaId ?? null, bodyMd: p?.bodyMd ?? '',
  };
}

function toInput(f: Form, id: string | null): ProjectInput {
  const orNull = (s: string) => (s.trim() ? s.trim() : null);
  return {
    ...(id ? { id } : {}),
    slug: f.slug, title: f.title, oneLiner: f.oneLiner, category: f.category as ProjectInput['category'],
    year: f.year.trim() ? Number(f.year) : null, role: f.role, stack: f.stack, status: f.status,
    githubUrl: orNull(f.githubUrl), demoUrl: orNull(f.demoUrl), videoUrl: orNull(f.videoUrl),
    coverMediaId: f.coverMediaId, bodyMd: f.bodyMd,
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Input({ label, value, onChange, max, type = 'text', error, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; max?: number; type?: string; error?: string; placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="admin-label">{label}</span>
      <input className={`admin-input ${error ? 'border-orange' : ''}`} type={type} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {(error || max) && (
        <span className={`flex justify-between text-[13px] ${error ? 'text-orange' : 'text-admin-muted'}`}>
          <span>{error}</span>
          {max && type === 'text' && <span className="font-mono text-xs text-admin-muted">{value.length}/{max}</span>}
        </span>
      )}
    </label>
  );
}

function StackChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && value.length < 12 && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="admin-label">Stack ({value.length}/12)</span>
      <div className="flex flex-wrap gap-1.5">
        {value.map((s) => (
          <span key={s} className="flex items-center gap-1 rounded-pill border-[1.5px] border-admin-line bg-white py-1 pr-1 pl-3 text-[14px]">
            {s}
            <button type="button" aria-label={`Remove ${s}`} className="size-7 rounded-full text-admin-muted" onClick={() => onChange(value.filter((x) => x !== s))}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="admin-input"
          value={draft}
          maxLength={30}
          placeholder="Add a technology"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="admin-btn" onClick={add} disabled={!draft.trim() || value.length >= 12}>Add</button>
      </div>
    </div>
  );
}

// docs/DASHBOARD.md "Project editor". Autosave only while unpublished (D-012); a published
// project changes live only on Update.
export function ProjectForm({ project }: { project: ProjectRow | null }) {
  const router = useRouter();
  const { upsertMedia, mediaById } = useAdminData();
  const [id, setId] = useState<string | null>(project?.id ?? null);
  const [form, setForm] = useState<Form>(() => toForm(project));
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [published, setPublished] = useState(project?.published ?? false);
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(project?.updatedAt ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ html: string } | null>(null);
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [color, setColor] = useState<TileColor>('orange');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(form);
  useEffect(() => {
    latest.current = form;
  }, [form]);

  const parsed = projectInput.safeParse(toInput(form, id));
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;

  const save = useCallback(async (): Promise<boolean> => {
    const check = projectInput.safeParse(toInput(latest.current, id));
    if (!check.success) {
      setSaveError('Fix the highlighted fields to save');
      return false;
    }
    setSaving(true);
    const result = await saveProject(check.data);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error === 'slug_taken' ? 'That slug is already used by another project' : `Couldn't save (${result.error})`);
      return false;
    }
    setSaveError(null);
    setDirty(false);
    setSavedAt(result.data.updatedAt);
    if (!id) {
      setId(result.data.id);
      // Update the URL without remounting the form (Next syncs history.replaceState).
      window.history.replaceState(null, '', `/admin/projects/${result.data.id}`);
    }
    return true;
  }, [id]);

  function update(patch: Partial<Form>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (patch.title !== undefined && !slugTouched) next.slug = slugify(patch.title);
      return next;
    });
    setDirty(true);
  }

  // Autosave while unpublished (debounce 1500ms).
  useEffect(() => {
    if (!dirty || published) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [form, dirty, published, save]);

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

  const publish = () => run('publish', async () => {
    if ((dirty || !id) && !(await save())) return;
    const target = id ?? null;
    if (!target) return;
    const r = await setProjectPublished(target, true);
    if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Couldn't publish (${r.error}).` });
    setPublished(true);
    router.refresh();
    setToast({ id: nextToastId(), tone: 'info', body: <span>Published. <a className="underline" href={`/projects/${form.slug}`} target="_blank" rel="noreferrer">View ↗</a></span> });
  });

  const updateLive = () => run('update', async () => {
    if (await save()) {
      router.refresh();
      setToast({ id: nextToastId(), tone: 'info', body: 'Live page updated.' });
    }
  });

  const unpublish = () => run('unpublish', async () => {
    if (!id || !window.confirm('Unpublish? The page and any Home tile for it disappear from the live site.')) return;
    const r = await setProjectPublished(id, false);
    if (!r.ok) return setToast({ id: nextToastId(), tone: 'error', body: `Couldn't unpublish (${r.error}).` });
    setPublished(false);
    router.refresh();
    setToast({ id: nextToastId(), tone: 'info', body: 'Unpublished.' });
  });

  const remove = () => run('delete', async () => {
    if (!id) return router.push('/admin/projects');
    if (!window.confirm('Delete this project permanently?')) return;
    const r = await deleteProject(id);
    if (!r.ok) {
      return setToast({ id: nextToastId(), tone: 'error', body: r.error.startsWith('Used in:') ? `Can't delete. ${r.error}` : `Delete failed (${r.error}).` });
    }
    setDirty(false);
    router.push('/admin/projects');
    router.refresh();
  });

  async function toggleFeatured(v: boolean) {
    setFeatured(v);
    if (!id) return;
    const r = await setProjectFeatured(id, v);
    if (!r.ok) {
      setFeatured(!v);
      setToast({ id: nextToastId(), tone: 'error', body: `Couldn't update Featured (${r.error}).` });
    } else router.refresh();
  }

  async function openPreview() {
    setPreview({ html: form.bodyMd.trim() ? await renderMarkdownPreview(form.bodyMd) : '' });
  }

  async function uploadInline(file: File) {
    const alt = window.prompt('Alt text for this image (required):')?.trim();
    if (!alt) throw new Error('Alt text is required to insert an image.');
    const item = await uploadMedia(file, alt);
    upsertMedia(item);
    return { url: item.url, alt };
  }

  const cover = form.coverMediaId ? mediaById.get(form.coverMediaId) : undefined;
  const card = {
    id: id ?? 'preview', slug: form.slug || 'preview', title: form.title || 'Untitled', oneLiner: form.oneLiner,
    category: form.category, year: form.year ? Number(form.year) : null, coverUrl: cover?.url ?? null, coverAlt: cover?.alt ?? '', featured,
  };
  const dims = { S: { w: 1, h: 1 }, M: { w: 2, h: 1 }, L: { w: 2, h: 2 } }[size];
  const previewTile: Tile<'project'> = {
    id: card.id, type: 'project', pos: { x: 0, y: 0, ...dims }, color, stickers: [], mobileOrder: 0, hideOnMobile: false,
    config: { projectId: card.id },
  };

  const status = published
    ? (dirty ? 'Unsaved changes' : 'Live')
    : saving ? 'Saving…' : saveError ?? (dirty ? 'Unsaved changes' : savedAt ? `Autosaved · ${formatTime(savedAt)}` : 'Not saved yet');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[1.5px] border-admin-line bg-admin-panel px-6">
        <div className="flex min-w-0 items-center gap-3 text-[15px]">
          <Link href="/admin/projects" className="text-admin-muted">Dashboard / Projects</Link>
          <span className="text-admin-muted">/</span>
          <span className="truncate font-bold">{form.title || 'New project'}</span>
          <span className={`rounded-pill px-2.5 py-0.5 text-[12px] font-bold ${published ? 'bg-green' : 'bg-admin-line'}`}>{published ? 'Published' : 'Draft'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[14px] ${saveError ? 'text-orange' : 'text-admin-muted'}`} aria-live="polite">{status}</span>
          <button type="button" className="admin-btn" onClick={() => void openPreview()}>Preview</button>
          {published ? (
            <>
              <button type="button" className="admin-btn" onClick={() => void unpublish()} disabled={busy !== null}>Unpublish</button>
              <button type="button" className="admin-btn admin-btn-accent" onClick={() => void updateLive()} disabled={busy !== null || !dirty}>
                {busy === 'update' ? 'Updating…' : 'Update'}
              </button>
            </>
          ) : (
            <button type="button" className="admin-btn admin-btn-accent" onClick={() => void publish()} disabled={busy !== null}>
              {busy === 'publish' ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] gap-6 p-6">
        <div className="flex flex-col gap-5">
          <Input label="Title" value={form.title} max={80} onChange={(title) => update({ title })} error={form.title || id ? errors.title : undefined} />
          <Input label="Slug" value={form.slug} max={60} onChange={(v) => { setSlugTouched(true); update({ slug: v.toLowerCase() }); }} error={form.slug ? errors.slug && 'Lowercase letters, numbers and single hyphens' : undefined} />
          <Input label="One-liner (shown on tiles)" value={form.oneLiner} max={140} onChange={(oneLiner) => update({ oneLiner })} />
          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="admin-label">Category</span>
              <select className="admin-input" value={form.category} onChange={(e) => update({ category: e.target.value })}>
                {PROJECT_CATEGORIES.map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
              </select>
            </label>
            <Input label="Year" type="number" value={form.year} onChange={(year) => update({ year })} error={errors.year && 'Between 2015 and 2100'} />
            <label className="flex flex-col gap-1.5">
              <span className="admin-label">Status</span>
              <select className="admin-input" value={form.status} onChange={(e) => update({ status: e.target.value as ProjectStatus })}>
                {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>)}
              </select>
            </label>
          </div>
          <Input label="Role" value={form.role} max={60} onChange={(role) => update({ role })} />
          <StackChips value={form.stack} onChange={(stack) => update({ stack })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GitHub URL" type="url" value={form.githubUrl} onChange={(githubUrl) => update({ githubUrl })} error={errors.githubUrl && 'Enter a full URL'} placeholder="https://github.com/…" />
            <Input label="Demo URL" type="url" value={form.demoUrl} onChange={(demoUrl) => update({ demoUrl })} error={errors.demoUrl && 'Enter a full URL'} placeholder="https://…" />
          </div>
          <Input label="Video (YouTube or Vimeo link, replaces the cover on the page)" type="url" value={form.videoUrl} onChange={(videoUrl) => update({ videoUrl })} error={errors.videoUrl && 'Must be a YouTube or Vimeo link'} placeholder="https://www.youtube.com/watch?v=…" />
          <div className="flex flex-col gap-1.5">
            <span className="admin-label">Cover image</span>
            <MediaPicker kind="image" value={form.coverMediaId} onChange={(coverMediaId) => update({ coverMediaId })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="admin-label">Body</span>
            <MarkdownEditor value={form.bodyMd} onChange={(bodyMd) => update({ bodyMd })} onUploadImage={uploadInline} />
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-admin-line bg-admin-panel p-4">
            <div className="flex items-center justify-between">
              <span className="admin-label">Tile preview</span>
              <div className="flex rounded-pill border-[1.5px] border-admin-line bg-white p-0.5">
                {(['S', 'M', 'L'] as const).map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={`size-9 rounded-full text-[13px] font-bold ${size === s ? 'bg-ink text-cream' : ''}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="pointer-events-none origin-top-left" style={{ height: dims.h === 2 ? 320 : 150 }}>
              <div style={{ width: dims.w === 2 ? 596 : 290, height: dims.h === 2 ? 465 : 223, transform: `scale(${dims.w === 2 ? 328 / 596 : 0.66})`, transformOrigin: 'top left' }}>
                <TileShell tile={previewTile} className="h-full w-full">
                  <ProjectRender tile={previewTile} data={{ ...card, draft: false }} />
                </TileShell>
              </div>
            </div>
            <div className="flex gap-1.5">
              {TILE_COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Preview ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className="size-8 rounded-full" style={{ background: TILE_STYLE[c].bg, border: TILE_STYLE[c].border ?? undefined, outline: color === c ? '3px solid #2B44FF' : undefined, outlineOffset: 2 }} />
              ))}
            </div>
            <p className="text-[12px] text-admin-muted">Color is preview-only; each Home tile sets its own color.</p>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5" checked={featured} disabled={!id} onChange={(e) => void toggleFeatured(e.target.checked)} />
            <span className="font-medium">Featured (eligible for the large tile)</span>
          </label>
          <button type="button" className="admin-btn self-start" onClick={() => void remove()} disabled={busy !== null}>Delete project</button>
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 p-6" onClick={() => setPreview(null)}>
          <div role="dialog" aria-modal="true" aria-label="Page preview" className="mx-auto max-w-[1600px] rounded-[28px] bg-cream p-8 text-ink" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <span className="t-meta">Preview{published ? '' : ' — not live'}</span>
              <button type="button" className="admin-btn" onClick={() => setPreview(null)}>Close</button>
            </div>
            <ProjectDetail
              project={{ ...card, role: form.role, stack: form.stack, status: form.status, githubUrl: form.githubUrl || null, demoUrl: form.demoUrl || null, videoUrl: form.videoUrl || null, bodyMd: form.bodyMd, nextSlug: null, nextTitle: null }}
              bodyHtml={preview.html}
            />
          </div>
        </div>
      )}
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}

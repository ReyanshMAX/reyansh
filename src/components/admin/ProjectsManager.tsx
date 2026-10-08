'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import ReactGridLayout, { getCompactor, useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { projectCategoryLabel } from '@/lib/categories';
import type { ProjectRow } from '@/lib/projects';
import { reorderProjects, setProjectFeatured } from '@/server/projects';
import { useAdminData } from './AdminData';
import { PageHeader } from './PageHeader';
import { nextToastId, Toast, type ToastMessage } from './Toast';

type Filter = 'all' | 'published' | 'drafts';
const ROW = 72;
const COLS = 'grid grid-cols-[40px_56px_minmax(0,1fr)_140px_110px_90px_110px_70px] items-center gap-4';
const compactor = getCompactor('vertical');

function Row({ p, draggable, onFeatured }: { p: ProjectRow; draggable: boolean; onFeatured: (v: boolean) => void }) {
  return (
    <div className={`${COLS} h-full rounded-2xl border-[1.5px] border-admin-line bg-white px-3`}>
      <span aria-hidden className={`project-drag text-center font-mono text-admin-muted ${draggable ? 'cursor-grab active:cursor-grabbing' : 'opacity-30'}`}>⋮⋮</span>
      {p.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- dashboard thumbnail
        <img src={p.coverUrl} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-lg bg-yellow text-[22px] font-extrabold">{p.title.slice(0, 1)}</span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-bold">{p.title}</span>
        <span className="block truncate font-mono text-xs text-admin-muted">/projects/{p.slug}</span>
      </span>
      <span className="text-[14px]">{projectCategoryLabel(p.category)}</span>
      <span className={`justify-self-start rounded-pill px-2.5 py-0.5 text-[12px] font-bold ${p.published ? 'bg-green' : 'bg-admin-line'}`}>
        {p.published ? 'Published' : 'Draft'}
      </span>
      <label className="flex min-h-11 items-center">
        <input type="checkbox" className="size-5" checked={p.featured} aria-label={`Featured: ${p.title}`} onChange={(e) => onFeatured(e.target.checked)} />
      </label>
      <span className="font-mono text-xs text-admin-muted">{new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      <Link href={`/admin/projects/${p.id}`} className="font-bold underline">Edit</Link>
    </div>
  );
}

// docs/DASHBOARD.md "Projects manager". Rows reorder with the same react-grid-layout (one column).
export function ProjectsManager() {
  const router = useRouter();
  const { projects: initial } = useAdminData();
  const [projects, setProjects] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setProjects(initial);
  }
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const { width, containerRef, mounted } = useContainerWidth();

  const shown = projects.filter((p) => filter === 'all' || (filter === 'published' ? p.published : !p.published));
  const canDrag = filter === 'all';
  const layout: Layout = shown.map((p, i) => ({ i: p.id, x: 0, y: i, w: 1, h: 1 }));

  async function reorder(l: Layout) {
    const ids = [...l].sort((a, b) => a.y - b.y).map((item) => item.i);
    if (ids.every((id, i) => id === projects[i]?.id)) return;
    const before = projects;
    setProjects(ids.map((id) => projects.find((p) => p.id === id)!).filter(Boolean));
    const r = await reorderProjects(ids);
    if (!r.ok) {
      setProjects(before);
      setToast({ id: nextToastId(), tone: 'error', body: `Couldn't save the order (${r.error}).` });
    } else router.refresh();
  }

  async function featured(p: ProjectRow, v: boolean) {
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, featured: v } : x)));
    const r = await setProjectFeatured(p.id, v);
    if (!r.ok) {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, featured: !v } : x)));
      setToast({ id: nextToastId(), tone: 'error', body: `Couldn't update Featured (${r.error}).` });
    } else router.refresh();
  }

  const tab = (f: Filter, label: string) => (
    <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`min-h-11 rounded-pill px-4 text-[14px] font-bold ${filter === f ? 'bg-ink text-cream' : ''}`}>
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title="Projects">
        <Link href="/admin/projects/new" className="admin-btn admin-btn-accent">+ New project</Link>
      </PageHeader>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex rounded-pill border-[1.5px] border-admin-line bg-white p-0.5 self-start">
          {tab('all', `All (${projects.length})`)}
          {tab('published', 'Published')}
          {tab('drafts', 'Drafts')}
        </div>
        <div className={`${COLS} px-3 font-mono text-xs text-admin-muted uppercase`}>
          <span /><span>Cover</span><span>Title</span><span>Category</span><span>Status</span><span>Featured</span><span>Updated</span><span />
        </div>
        {shown.length === 0 && <p className="text-admin-muted">No projects here yet.</p>}
        <div ref={containerRef}>
          {mounted && shown.length > 0 && (
            <ReactGridLayout
              width={width}
              layout={layout}
              gridConfig={{ cols: 1, rowHeight: ROW, margin: [0, 10], containerPadding: [0, 0] }}
              dragConfig={{ enabled: canDrag, handle: '.project-drag' }}
              resizeConfig={{ enabled: false, handles: [] }}
              compactor={compactor}
              onDragStop={(l) => void reorder(l)}
            >
              {shown.map((p) => (
                <div key={p.id}>
                  <Row p={p} draggable={canDrag} onFeatured={(v) => void featured(p, v)} />
                </div>
              ))}
            </ReactGridLayout>
          )}
        </div>
        <p className="text-[14px] text-admin-muted">
          Drag to set order on the Projects page. Featured projects can fill the large tile.
          {!canDrag && ' Switch to All to reorder.'}
        </p>
      </div>
      <Toast toast={toast} onDone={clearToast} />
    </>
  );
}

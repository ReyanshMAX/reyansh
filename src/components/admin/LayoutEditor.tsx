'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { pagePath, type PageSlug, type Tile } from '@/lib/tiles';
import { discardDraft, getDraftLayout, publishLayout } from '@/server/layouts';
import type { LayoutError } from '@/tiles/validate';
import { AddTileModal } from './AddTileModal';
import { GridEditor, hasContent } from './GridEditor';
import { StackingOrder } from './StackingOrder';
import { TileInspector } from './TileInspector';
import { nextToastId, Toast, type ToastMessage } from './Toast';
import { useLayoutEditor, type SaveState } from './useLayoutEditor';

const PAGE_LABEL: Record<PageSlug, string> = { home: 'Home', about: 'About' };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function describeError(e: LayoutError): string {
  switch (e.code) {
    case 'schema': return e.message;
    case 'size': return e.message;
    case 'bounds': return 'A tile runs past the right edge of the grid.';
    case 'overlap': return 'Two tiles overlap.';
    case 'mobile_order': return e.message;
    case 'missing_ref': return e.ref === 'media' ? 'A Photo tile has no photo picked (or it was deleted).' : 'A Project tile points at a missing or unpublished project.';
  }
}

function errorTileIds(errors: LayoutError[]): Set<string> {
  const ids = new Set<string>();
  for (const e of errors) {
    if ('tileId' in e && e.tileId) ids.add(e.tileId);
    if (e.code === 'overlap') e.tileIds.forEach((id) => ids.add(id));
  }
  return ids;
}

function SaveStatus({ state, savedAt, onRetry }: { state: SaveState; savedAt: string | null; onRetry: () => void }) {
  if (state === 'error') {
    return (
      <button type="button" onClick={onRetry} className="text-[14px] font-medium text-orange underline">
        Couldn&apos;t save — retry
      </button>
    );
  }
  const text = state === 'saving' ? 'Saving…' : state === 'unsaved' ? 'Unsaved changes' : savedAt ? `Draft saved · ${formatTime(savedAt)}` : 'Draft saved';
  return <span className="text-[14px] text-admin-muted" aria-live="polite">{text}</span>;
}

export function LayoutEditor({ page, initialTiles, initialSavedAt }: {
  page: PageSlug;
  initialTiles: Tile[];
  initialSavedAt: string | null;
}) {
  const editor = useLayoutEditor(page, initialTiles, initialSavedAt);
  const router = useRouter();

  // Save pending edits before leaving this page's draft.
  async function switchPage(next: PageSlug) {
    if (next === page) return;
    if (!(await editor.flush())) {
      setToast({ id: nextToastId(), tone: 'error', body: "Couldn't save this page's draft; fix it before switching." });
      return;
    }
    router.push(`/admin/layout/${next}`);
  }
  const [mode, setMode] = useState<'desktop' | 'stacking'>('desktop');
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<'publish' | 'discard' | null>(null);
  const [invalidIds, setInvalidIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const selected = editor.tiles.find((t) => t.id === editor.selectedId) ?? null;
  const { select } = editor;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !adding) select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [adding, select]);

  function removeTile(id: string) {
    const tile = editor.tiles.find((t) => t.id === id);
    if (tile && hasContent(tile) && !window.confirm('Delete this tile? Its content will be lost.')) return;
    editor.removeTile(id);
  }

  async function preview() {
    // Open synchronously (popup blockers), then point it at the preview once the draft is saved.
    const win = window.open('about:blank', '_blank');
    await editor.flush();
    if (win) win.location.href = `/admin/preview/${page}`;
  }

  async function discard() {
    if (!window.confirm('Discard all draft changes and go back to the published layout?')) return;
    setBusy('discard');
    try {
      await editor.flush();
      const result = await discardDraft(page);
      const fresh = result.ok ? await getDraftLayout(page) : result;
      if (!fresh.ok) {
        setToast({ id: nextToastId(), tone: 'error', body: `Couldn't discard (${fresh.error}).` });
        return;
      }
      editor.reset(fresh.data.tiles, fresh.data.updatedAt);
      setInvalidIds(new Set());
      setToast({ id: nextToastId(), tone: 'info', body: 'Draft discarded.' });
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setBusy('publish');
    try {
      if (!(await editor.flush())) {
        setToast({ id: nextToastId(), tone: 'error', body: "Couldn't save the draft, so nothing was published." });
        return;
      }
      const result = await publishLayout(page);
      if (result.ok) {
        setInvalidIds(new Set());
        setToast({
          id: nextToastId(),
          tone: 'info',
          body: (
            <span>
              Published.{' '}
              <a href={pagePath(page)} target="_blank" rel="noreferrer" className="underline">View live page ↗</a>
            </span>
          ),
        });
        return;
      }
      const errors = (Array.isArray(result.details) ? result.details : []) as LayoutError[];
      setInvalidIds(errorTileIds(errors));
      setMode('desktop');
      setToast({
        id: nextToastId(),
        tone: 'error',
        body: errors.length ? (
          <div>
            <p className="font-bold">Can&apos;t publish yet:</p>
            <ul className="mt-1 list-disc pl-5">{errors.map((e, i) => <li key={i}>{describeError(e)}</li>)}</ul>
          </div>
        ) : `Publish failed (${result.error}).`,
      });
    } finally {
      setBusy(null);
    }
  }

  const modeBtn = (m: typeof mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      className={`min-h-11 rounded-pill px-4 text-[14px] font-bold ${mode === m ? 'bg-ink text-cream' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[1.5px] border-admin-line bg-admin-panel px-6">
        <div className="flex items-center gap-5">
          <div className="text-[15px]">
            <Link href="/admin" className="text-admin-muted">Dashboard</Link>
            <span className="mx-2 text-admin-muted">/</span>
            <label className="font-bold">
              Page:{' '}
              <select
                className="rounded-lg border-[1.5px] border-admin-line bg-white px-2 py-1.5 font-bold"
                value={page}
                onChange={(e) => void switchPage(e.target.value as PageSlug)}
              >
                {(Object.keys(PAGE_LABEL) as PageSlug[]).map((p) => <option key={p} value={p}>{PAGE_LABEL[p]}</option>)}
              </select>
            </label>
          </div>
          <div className="flex rounded-pill border-[1.5px] border-admin-line bg-white p-0.5">
            {modeBtn('desktop', 'Desktop')}
            {modeBtn('stacking', 'Stacking order')}
          </div>
          <div className="flex gap-1">
            <button type="button" className="admin-btn px-3" onClick={editor.undo} disabled={!editor.canUndo} aria-label="Undo">↶</button>
            <button type="button" className="admin-btn px-3" onClick={editor.redo} disabled={!editor.canRedo} aria-label="Redo">↷</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus state={editor.saveState} savedAt={editor.savedAt} onRetry={() => void editor.retry()} />
          <button type="button" className="admin-btn" onClick={() => void preview()}>Preview</button>
          <button type="button" className="admin-btn" onClick={() => void discard()} disabled={busy !== null}>
            {busy === 'discard' ? 'Discarding…' : 'Discard draft'}
          </button>
          <button type="button" className="admin-btn admin-btn-accent" onClick={() => void publish()} disabled={busy !== null}>
            {busy === 'publish' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <div className="min-w-0 flex-1 p-6">
          {mode === 'desktop' ? (
            <>
              <p className="mb-4 font-mono text-xs text-admin-muted">Grid: 6 columns · drag ⋮⋮ to move · drag corner to resize</p>
              <GridEditor
                tiles={editor.tiles}
                selectedId={editor.selectedId}
                errorTileIds={invalidIds}
                onSelect={editor.select}
                onRemove={editor.removeTile}
                onPositions={editor.applyPositions}
                onAddClick={() => setAdding(true)}
              />
            </>
          ) : (
            <StackingOrder tiles={editor.tiles} onReorder={editor.reorderMobile} />
          )}
        </div>
        <aside className="w-[380px] shrink-0 overflow-y-auto border-l-[1.5px] border-admin-line bg-admin-panel p-6">
          <h2 className="mb-5 text-[20px] font-extrabold">Tile settings</h2>
          <TileInspector tile={selected} tiles={editor.tiles} onUpdate={editor.updateTile} onDelete={removeTile} />
        </aside>
      </div>
      <AddTileModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(type) => {
          editor.addTile(type);
          setAdding(false);
        }}
      />
      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}

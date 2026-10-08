'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { pagePath, type PageSlug, type Tile } from '@/lib/tiles';
import { publishLayout } from '@/server/layouts';
import type { LayoutError } from '@/tiles/validate';
import { AddTileModal } from './AddTileModal';
import { GridEditor } from './GridEditor';
import { TileInspector } from './TileInspector';
import { Toast, type ToastMessage } from './Toast';
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
    case 'missing_ref': return `A ${e.ref} tile points at something that is missing or unpublished.`;
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
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [invalidIds, setInvalidIds] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const selected = editor.tiles.find((t) => t.id === editor.selectedId) ?? null;

  async function publish() {
    setPublishing(true);
    try {
      if (!(await editor.flush())) {
        setToast({ id: Date.now(), tone: 'error', body: "Couldn't save the draft, so nothing was published." });
        return;
      }
      const result = await publishLayout(page);
      if (result.ok) {
        setInvalidIds(new Set());
        setToast({
          id: Date.now(),
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
      setToast({
        id: Date.now(),
        tone: 'error',
        body: errors.length ? (
          <div>
            <p className="font-bold">Can&apos;t publish yet:</p>
            <ul className="mt-1 list-disc pl-5">{errors.map((e, i) => <li key={i}>{describeError(e)}</li>)}</ul>
          </div>
        ) : `Publish failed (${result.error}).`,
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b-[1.5px] border-admin-line bg-admin-panel px-6">
        <div className="text-[15px]">
          <Link href="/admin" className="text-admin-muted">Dashboard</Link>
          <span className="mx-2 text-admin-muted">/</span>
          <span className="font-bold">Page: {PAGE_LABEL[page]}</span>
        </div>
        <div className="flex items-center gap-4">
          <SaveStatus state={editor.saveState} savedAt={editor.savedAt} onRetry={() => void editor.retry()} />
          <button type="button" className="admin-btn admin-btn-accent" onClick={publish} disabled={publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </header>
      <div className="flex flex-1">
        <div className="min-w-0 flex-1 p-6">
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
        </div>
        <aside className="w-[380px] shrink-0 border-l-[1.5px] border-admin-line bg-admin-panel p-6">
          <h2 className="mb-5 text-[20px] font-extrabold">Tile settings</h2>
          <TileInspector tile={selected} onConfigChange={(id, config) => editor.updateTile(id, { config })} />
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TileType } from '@/lib/tiles';
import { registeredTileDefs } from '@/tiles/registry';

export function AddTileModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: TileType) => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TileType | null>(null);
  const defs = useMemo(() => registeredTileDefs(), []);
  const q = query.trim().toLowerCase();
  const shown = defs.filter((d) => !q || d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tile-title"
        className="flex w-full max-w-[880px] flex-col gap-5 rounded-[28px] bg-admin-panel p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="add-tile-title" className="text-[28px] font-extrabold tracking-[-0.02em]">Add tile</h2>
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
        </div>
        <input
          className="admin-input"
          placeholder="Search tiles"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">
          {shown.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => setSelected(def.type)}
              onDoubleClick={() => onAdd(def.type)}
              aria-pressed={selected === def.type}
              className={`flex min-h-28 flex-col items-start gap-1 rounded-2xl border-[1.5px] bg-white p-4 text-left ${
                selected === def.type ? 'border-admin-accent outline-2 outline-admin-accent' : 'border-admin-line'
              }`}
            >
              <span className="text-[18px] font-bold">{def.label}</span>
              <span className="text-[14px] text-admin-muted">{def.description}</span>
              <span className="mt-auto font-mono text-xs text-admin-muted">
                {def.defaultSize.w}×{def.defaultSize.h}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="admin-btn admin-btn-accent"
            disabled={!selected}
            onClick={() => selected && onAdd(selected)}
          >
            Add to grid
          </button>
        </div>
      </div>
    </div>
  );
}

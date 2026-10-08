'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdminData } from './AdminData';

// Picks a media item by id. Images with empty alt text are greyed out and not
// pickable (docs/DASHBOARD.md "Media").
export function MediaPicker({ kind, value, onChange }: {
  kind: 'image' | 'file';
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { media, mediaById } = useAdminData();
  const [open, setOpen] = useState(false);
  const selected = value ? mediaById.get(value) : undefined;
  const items = media.filter((m) => m.kind === kind);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-[10px] border-[1.5px] border-admin-line bg-white p-2">
        {selected && kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element -- dashboard thumbnail
          <img src={selected.url} alt={selected.alt} className="size-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-admin-bg font-mono text-xs text-admin-muted">
            {kind === 'file' ? 'PDF' : 'None'}
          </div>
        )}
        <span className="min-w-0 flex-1 truncate text-[14px]">
          {selected ? (kind === 'image' ? selected.alt : selected.path.split('/').pop()) : value ? 'Missing file' : 'Nothing selected'}
        </span>
        <button type="button" className="admin-btn" onClick={() => setOpen(true)}>Choose</button>
        {value && (
          <button type="button" className="admin-btn" onClick={() => onChange(null)} aria-label="Clear selection">×</button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={kind === 'image' ? 'Choose a photo' : 'Choose a file'}
            className="flex max-h-[80vh] w-full max-w-[880px] flex-col gap-4 rounded-[28px] bg-admin-panel p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[24px] font-extrabold">{kind === 'image' ? 'Choose a photo' : 'Choose a file'}</h2>
              <button type="button" className="admin-btn" onClick={() => setOpen(false)}>Cancel</button>
            </div>
            {items.length === 0 && (
              <p className="text-admin-muted">
                Nothing here yet. <Link href="/admin/media" className="text-ink underline">Upload in Media</Link>
              </p>
            )}
            <div className={`grid gap-3 overflow-y-auto ${kind === 'image' ? 'grid-cols-4' : 'grid-cols-1'}`}>
              {items.map((m) => {
                const disabled = m.kind === 'image' && !m.alt.trim();
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'Add alt text in Media first' : undefined}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={`flex flex-col gap-1.5 rounded-2xl border-[1.5px] bg-white p-2 text-left disabled:cursor-not-allowed disabled:opacity-40 ${
                      m.id === value ? 'border-admin-accent' : 'border-admin-line'
                    }`}
                  >
                    {m.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element -- dashboard thumbnail
                      <img src={m.url} alt={m.alt} className="aspect-square w-full rounded-xl object-cover" />
                    ) : null}
                    <span className="truncate px-1 text-[13px]">
                      {m.kind === 'image' ? m.alt || 'No alt text' : m.path.split('/').pop()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

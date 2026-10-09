'use client';

import { useState } from 'react';
import type { TimelineEntry } from '@/lib/tiles';
import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

const MAX = 10;

function validHref(s: string): boolean {
  if (!s.trim()) return true;
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Edits stay local until they form a valid entry (year + label, optional full URL),
// so the layout never autosaves an invalid timeline.
function EntryForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: TimelineEntry | null;
  submitLabel: string;
  onSubmit: (e: TimelineEntry) => void;
  onCancel?: () => void;
}) {
  const [year, setYear] = useState(initial?.year ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [href, setHref] = useState(initial?.href ?? '');
  const hrefOk = validHref(href);
  const ok = year.trim() && label.trim() && hrefOk;
  return (
    <form
      className="flex flex-col gap-2 rounded-[10px] border-[1.5px] border-admin-line bg-white p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onSubmit({ year: year.trim(), label: label.trim(), href: href.trim() || null });
        if (!initial) {
          setYear('');
          setLabel('');
          setHref('');
        }
      }}
    >
      <div className="grid grid-cols-[96px_1fr] gap-2">
        <input className="admin-input" placeholder="Year" aria-label="Year" maxLength={12} value={year} onChange={(e) => setYear(e.target.value)} />
        <input className="admin-input" placeholder="What happened" aria-label="Label" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <input className={`admin-input ${hrefOk ? '' : 'border-orange'}`} placeholder="Link (optional, https://…)" aria-label="Link" value={href} onChange={(e) => setHref(e.target.value)} />
      {!hrefOk && <span className="text-[13px] text-orange">Enter a full URL starting with https://</span>}
      <div className="flex gap-2">
        <button type="submit" className="admin-btn" disabled={!ok}>{submitLabel}</button>
        {onCancel && <button type="button" className="admin-btn" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export function TimelineInspector({ config, onChange }: TileInspectorProps<'timeline'>) {
  const [editing, setEditing] = useState<number | null>(null);
  const entries = config.entries;
  const set = (next: TimelineEntry[]) => onChange({ ...config, entries: next });
  const move = (i: number, d: -1 | 1) => {
    const next = [...entries];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  return (
    <div className="flex flex-col gap-4">
      <Field label="Heading" value={config.heading} max={30} onChange={(heading) => onChange({ ...config, heading })} />
      <span className="admin-label">Entries ({entries.length}/{MAX}), top to bottom</span>
      <ul className="flex flex-col gap-2">
        {entries.map((e, i) => editing === i ? (
          <li key={`edit-${i}`}>
            <EntryForm
              initial={e}
              submitLabel="Save"
              onSubmit={(next) => {
                set(entries.map((x, j) => (j === i ? next : x)));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </li>
        ) : (
          <li key={`${i}-${e.year}-${e.label}`} className="flex items-center gap-1 rounded-[10px] border-[1.5px] border-admin-line bg-white pl-3">
            <button type="button" className="min-h-10 flex-1 truncate text-left text-[15px]" onClick={() => setEditing(i)} title="Edit">
              <span className="font-mono text-[13px] text-admin-muted">{e.year}</span> {e.label}{e.href ? ' ↗' : ''}
            </button>
            <button type="button" className="size-10 text-admin-muted disabled:opacity-30" aria-label={`Move ${e.label} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button type="button" className="size-10 text-admin-muted disabled:opacity-30" aria-label={`Move ${e.label} down`} disabled={i === entries.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button type="button" className="size-10 text-admin-muted" aria-label={`Remove ${e.label}`} onClick={() => set(entries.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      {entries.length < MAX && editing === null && (
        <EntryForm initial={null} submitLabel="Add entry" onSubmit={(e) => set([...entries, e])} />
      )}
    </div>
  );
}

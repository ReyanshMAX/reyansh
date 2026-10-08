'use client';

import { useState } from 'react';
import type { TileInspectorProps } from '../types';

const MIN = 2;
const MAX = 8;

export function MarqueeInspector({ config, onChange }: TileInspectorProps<'marquee'>) {
  const [draft, setDraft] = useState('');
  const words = config.words;
  const set = (next: string[]) => onChange({ ...config, words: next });
  const move = (i: number, d: -1 | 1) => {
    const next = [...words];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  const add = () => {
    const w = draft.trim();
    if (!w || words.length >= MAX) return;
    set([...words, w]);
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-3">
      <span className="admin-label">Words ({words.length}/{MAX}, at least {MIN})</span>
      <ul className="flex flex-col gap-2">
        {words.map((w, i) => (
          <li key={`${i}-${w}`} className="flex items-center gap-1 rounded-[10px] border-[1.5px] border-admin-line bg-white pl-3">
            <span className="flex-1 truncate text-[15px]">{w}</span>
            <button type="button" className="size-10 text-admin-muted disabled:opacity-30" aria-label={`Move ${w} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button type="button" className="size-10 text-admin-muted disabled:opacity-30" aria-label={`Move ${w} down`} disabled={i === words.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button type="button" className="size-10 text-admin-muted disabled:opacity-30" aria-label={`Remove ${w}`} disabled={words.length <= MIN} onClick={() => set(words.filter((_, j) => j !== i))}>×</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="admin-input"
          placeholder="Add a word"
          value={draft}
          maxLength={30}
          disabled={words.length >= MAX}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="admin-btn" onClick={add} disabled={!draft.trim() || words.length >= MAX}>Add</button>
      </div>
    </div>
  );
}

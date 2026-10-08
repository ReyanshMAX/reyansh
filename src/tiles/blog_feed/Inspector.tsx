'use client';

import type { TileInspectorProps } from '../types';

const COUNTS = [1, 2, 3, 4, 5] as const;

export function BlogFeedInspector({ config, onChange }: TileInspectorProps<'blog_feed'>) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Posts shown</span>
        <select className="admin-input" value={config.count} onChange={(e) => onChange({ count: Number(e.target.value) as (typeof COUNTS)[number] })}>
          {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <p className="text-[14px] text-admin-muted">Newest live posts with &ldquo;Show in Home blog feed&rdquo; checked. Updates on publish, no layout re-publish needed.</p>
    </div>
  );
}

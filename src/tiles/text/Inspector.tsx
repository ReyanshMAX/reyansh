'use client';

import type { TileInspectorProps } from '../types';

const LIMITS = { eyebrow: 30, heading: 80, body: 400 } as const;

export function TextInspector({ config, onChange }: TileInspectorProps<'text'>) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Eyebrow</span>
        <input
          className="admin-input"
          value={config.eyebrow}
          maxLength={LIMITS.eyebrow}
          onChange={(e) => onChange({ ...config, eyebrow: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Heading</span>
        <input
          className="admin-input"
          value={config.heading}
          maxLength={LIMITS.heading}
          onChange={(e) => onChange({ ...config, heading: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Body</span>
        <textarea
          className="admin-input min-h-32 resize-y"
          value={config.body}
          maxLength={LIMITS.body}
          onChange={(e) => onChange({ ...config, body: e.target.value })}
        />
        <span className="self-end font-mono text-xs text-admin-muted">
          {config.body.length}/{LIMITS.body}
        </span>
      </label>
    </div>
  );
}

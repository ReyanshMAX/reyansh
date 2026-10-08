'use client';

import { MediaPicker } from '@/components/admin/MediaPicker';
import { NIL_UUID } from '@/lib/media';
import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

export function MediaInspector({ config, onChange }: TileInspectorProps<'media'>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="admin-label">Photo</span>
        <MediaPicker
          kind="image"
          value={config.mediaId === NIL_UUID ? null : config.mediaId}
          onChange={(id) => onChange({ ...config, mediaId: id ?? NIL_UUID })}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Fit</span>
        <select
          className="admin-input"
          value={config.fit}
          onChange={(e) => onChange({ ...config, fit: e.target.value as 'cover' | 'contain' })}
        >
          <option value="cover">Cover (crop to fill)</option>
          <option value="contain">Contain (show whole photo)</option>
        </select>
      </label>
      <Field label="Caption" value={config.caption} max={80} onChange={(caption) => onChange({ ...config, caption })} />
    </div>
  );
}

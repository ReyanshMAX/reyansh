'use client';

import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

export function TextInspector({ config, onChange }: TileInspectorProps<'text'>) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Eyebrow" value={config.eyebrow} max={30} onChange={(eyebrow) => onChange({ ...config, eyebrow })} />
      <Field label="Heading" value={config.heading} max={80} onChange={(heading) => onChange({ ...config, heading })} />
      <Field label="Body" value={config.body} max={400} multiline onChange={(body) => onChange({ ...config, body })} />
    </div>
  );
}

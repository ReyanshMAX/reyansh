'use client';

import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

export function HeroInspector({ config, onChange }: TileInspectorProps<'hero'>) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Name" value={config.name} max={40} onChange={(name) => onChange({ ...config, name })} />
      <Field label="Tagline" value={config.tagline} max={200} multiline onChange={(tagline) => onChange({ ...config, tagline })} />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

export function LinksInspector({ config, onChange }: TileInspectorProps<'links'>) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Heading" value={config.heading} max={30} onChange={(heading) => onChange({ ...config, heading })} />
      <p className="text-[14px] text-admin-muted">
        Email, GitHub and LinkedIn come from Settings; blank ones are hidden.{' '}
        <Link href="/admin/settings" className="font-medium text-ink underline">Edit in Settings</Link>
      </p>
    </div>
  );
}

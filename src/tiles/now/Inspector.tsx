'use client';

import Link from 'next/link';
import { useAdminData } from '@/components/admin/AdminData';
import { Field } from '../fields';
import type { TileInspectorProps } from '../types';

export function NowInspector({ config, onChange }: TileInspectorProps<'now'>) {
  const { settings } = useAdminData();
  return (
    <div className="flex flex-col gap-4">
      <Field label="Label" value={config.label} max={30} onChange={(label) => onChange({ ...config, label })} />
      <div className="flex flex-col gap-1.5">
        <span className="admin-label">Now text (shared by every Now tile)</span>
        <p className="rounded-[10px] border-[1.5px] border-dashed border-admin-line bg-white px-3 py-2.5 text-[15px]">
          {settings.nowText || <span className="text-admin-muted">Empty</span>}
        </p>
        <Link href="/admin/settings" className="self-start text-[14px] font-medium underline">Edit in Settings</Link>
      </div>
    </div>
  );
}

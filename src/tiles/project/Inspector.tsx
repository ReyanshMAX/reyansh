'use client';

import Link from 'next/link';
import { useAdminData } from '@/components/admin/AdminData';
import { NIL_UUID } from '@/lib/media';
import type { TileInspectorProps } from '../types';

export function ProjectInspector({ config, onChange }: TileInspectorProps<'project'>) {
  const { projects } = useAdminData();
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="admin-label">Project</span>
        <select
          className="admin-input"
          value={config.projectId === NIL_UUID ? '' : config.projectId}
          onChange={(e) => onChange({ ...config, projectId: e.target.value || NIL_UUID })}
        >
          <option value="">Choose a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}{p.published ? '' : ' (draft)'}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[14px] text-admin-muted">
        Size picks the look: 1×1 title only, 2×1 row, 1×2 or 2×2 with the cover.{' '}
        <Link href="/admin/projects" className="font-medium text-ink underline">Manage projects</Link>
      </p>
    </div>
  );
}

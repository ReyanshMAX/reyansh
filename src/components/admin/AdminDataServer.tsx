import type { ReactNode } from 'react';
import { listAllProjects } from '@/server/projects';
import { getSettings, listMedia } from '@/server/queries';
import { AdminDataProvider } from './AdminData';

export async function AdminData({ children }: { children: ReactNode }) {
  const [settings, media, projects] = await Promise.all([getSettings(), listMedia(), listAllProjects()]);
  return (
    <AdminDataProvider settings={settings} media={media} projects={projects.ok ? projects.data : []}>
      {children}
    </AdminDataProvider>
  );
}

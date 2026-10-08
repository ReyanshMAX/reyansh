import type { ReactNode } from 'react';
import { listAllProjects } from '@/server/projects';
import { getSettings, listLivePosts, listMedia } from '@/server/queries';
import { AdminDataProvider } from './AdminData';

export async function AdminData({ children }: { children: ReactNode }) {
  const [settings, media, projects, feedPosts] = await Promise.all([
    getSettings(), listMedia(), listAllProjects(), listLivePosts({ limit: 5, offset: 0, feedOnly: true }),
  ]);
  return (
    <AdminDataProvider settings={settings} media={media} projects={projects.ok ? projects.data : []} feedPosts={feedPosts}>
      {children}
    </AdminDataProvider>
  );
}

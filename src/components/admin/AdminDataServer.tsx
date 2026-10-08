import type { ReactNode } from 'react';
import { getSettings, listMedia } from '@/server/queries';
import { AdminDataProvider } from './AdminData';

export async function AdminData({ children }: { children: ReactNode }) {
  const [settings, media] = await Promise.all([getSettings(), listMedia()]);
  return (
    <AdminDataProvider settings={settings} media={media}>
      {children}
    </AdminDataProvider>
  );
}

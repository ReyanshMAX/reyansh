import type { Metadata } from 'next';
import { ProjectsManager } from '@/components/admin/ProjectsManager';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Projects — Reyansh Rastogi' };

export default function ProjectsPage() {
  return <ProjectsManager />;
}

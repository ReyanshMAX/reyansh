import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { getProject } from '@/server/projects';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Project — Reyansh Rastogi' };

export default async function ProjectEditorPage({ params }: PageProps<'/admin/projects/[id]'>) {
  const { id } = await params;
  if (id === 'new') return <ProjectForm key="new" project={null} />;
  const result = await getProject(id);
  if (!result.ok) notFound();
  return <ProjectForm key={id} project={result.data} />;
}

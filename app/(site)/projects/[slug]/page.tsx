import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/site/Footer';
import { ProjectDetail } from '@/components/site/ProjectDetail';
import { renderMarkdown } from '@/lib/markdown';
import { pageMetadata } from '@/lib/site';
import { getPublishedProject, listPublishedProjects } from '@/server/queries';

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listPublishedProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const project = await getPublishedProject((await params).slug);
  return project
    ? pageMetadata(project.title, { description: project.oneLiner, coverUrl: project.coverUrl })
    : { title: 'Not found — Reyansh Rastogi' };
}

export default async function ProjectPage({ params }: PageProps<'/projects/[slug]'>) {
  const project = await getPublishedProject((await params).slug);
  if (!project) notFound();
  const bodyHtml = project.bodyMd.trim() ? await renderMarkdown(project.bodyMd) : '';
  return <ProjectDetail project={project} bodyHtml={bodyHtml} footer={<Footer />} />;
}

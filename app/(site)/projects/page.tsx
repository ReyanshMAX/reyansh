import type { Metadata } from 'next';
import { Footer } from '@/components/site/Footer';
import { ProjectsGrid } from '@/components/site/ProjectsGrid';
import { pageMetadata } from '@/lib/site';
import { getSettings, listPublishedProjects } from '@/server/queries';

export const metadata: Metadata = pageMetadata('Projects');

export default async function ProjectsPage() {
  const [projects, { email }] = await Promise.all([listPublishedProjects(), getSettings()]);
  return (
    <>
      <h1 className="t-page-title mb-8">Projects</h1>
      <ProjectsGrid projects={projects} email={email} />
      <Footer />
    </>
  );
}

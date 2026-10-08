import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Footer } from '@/components/site/Footer';
import { ProjectsGrid } from '@/components/site/ProjectsGrid';
import { getSettings, listPublishedProjects } from '@/server/queries';

export const metadata: Metadata = { title: 'Projects — Reyansh Rastogi' };

export default async function ProjectsPage() {
  const [projects, { email }] = await Promise.all([listPublishedProjects(), getSettings()]);
  return (
    <>
      <h1 className="t-page-title mb-8">Projects</h1>
      <Suspense>
        <ProjectsGrid projects={projects} email={email} />
      </Suspense>
      <Footer />
    </>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { PROJECT_CATEGORIES, projectCategoryLabel } from '@/lib/categories';
import type { ProjectCard } from '@/lib/projects';

function Cover({ project, sizes }: { project: ProjectCard; sizes: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-inner">
      {project.coverUrl ? (
        <Image src={project.coverUrl} alt={project.coverAlt} fill sizes={sizes} style={{ objectFit: 'cover' }} />
      ) : (
        <div className="t-title-l absolute inset-0 flex items-center justify-center bg-yellow text-ink">{project.title.slice(0, 1)}</div>
      )}
    </div>
  );
}

function meta(p: ProjectCard): string {
  return [projectCategoryLabel(p.category), p.year].filter(Boolean).join(' · ');
}

// ?c=<category> lives in the URL; the server renders every project (no filter), the
// client applies the filter after hydration so the static HTML stays complete.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
}
const readCategory = () => new URLSearchParams(window.location.search).get('c');

// Client-side category filter, ?c=<category> in the URL (docs/UI.md "/projects").
export function ProjectsGrid({ projects, email }: { projects: ProjectCard[]; email: string }) {
  const active = useSyncExternalStore(subscribe, readCategory, () => null);
  const shown = active ? projects.filter((p) => p.category === active) : projects;
  const featured = shown.find((p) => p.featured);
  const rest = shown.filter((p) => p !== featured);

  const setCategory = (c: string | null) => {
    window.history.replaceState(null, '', c ? `?c=${c}` : window.location.pathname);
    listeners.forEach((l) => l());
  };
  const pill = (c: string | null, label: string) => (
    <button
      key={c ?? 'all'}
      type="button"
      onClick={() => setCategory(c)}
      aria-pressed={active === c}
      className={`flex min-h-11 items-center rounded-pill border-[2.5px] border-ink px-5 text-[17px] font-bold ${active === c ? 'bg-ink text-cream' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {pill(null, 'All')}
        {PROJECT_CATEGORIES.map(([slug, label]) => pill(slug, label))}
      </div>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {featured && (
          <Link
            href={`/projects/${featured.slug}`}
            className="tile-link grid gap-6 rounded-tile bg-orange p-6 text-ink md:col-span-2 md:grid-cols-2"
          >
            <Cover project={featured} sizes="(max-width: 767px) 100vw, 25vw" />
            <div className="flex flex-col justify-end gap-2">
              <span className="t-meta">{meta(featured)} · Featured</span>
              <h2 className="t-title-l">{featured.title}</h2>
              {featured.oneLiner && <p className="t-body">{featured.oneLiner}</p>}
            </div>
          </Link>
        )}
        {rest.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.slug}`}
            className="tile-link flex flex-col gap-4 rounded-tile border-[2.5px] border-ink bg-paper p-5 text-ink"
          >
            <Cover project={p} sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw" />
            <div className="flex flex-col gap-1 px-1 pb-1">
              <h2 className="t-title-s">{p.title}</h2>
              <span className="t-meta">{meta(p)}</span>
            </div>
          </Link>
        ))}
        <a
          href={email ? `mailto:${email}` : undefined}
          className="tile-link flex min-h-[240px] flex-col justify-between gap-6 rounded-tile bg-ink p-7 text-cream"
        >
          <span className="t-title-s">Want to build something together?</span>
          <span className="text-[18px] font-bold">Get in touch ↗</span>
        </a>
      </div>
      {shown.length === 0 && <p className="mt-6 t-body">No projects in this category yet.</p>}
    </>
  );
}

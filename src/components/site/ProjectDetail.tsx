import 'katex/dist/katex.min.css';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { projectCategoryLabel } from '@/lib/categories';
import { PROJECT_STATUS_LABEL, type ProjectFull } from '@/lib/projects';
import { TILE_STYLE } from '@/lib/tokens';
import { videoEmbedUrl } from '@/lib/video';

const HEADER = TILE_STYLE.blue;

// Pure view shared by the public page and the editor's Preview modal. bodyHtml comes from
// renderMarkdown (src/lib/markdown.ts), never from user-supplied HTML.
export function ProjectDetail({ project, bodyHtml, footer }: {
  project: Omit<ProjectFull, 'id' | 'featured'>;
  bodyHtml: string;
  footer?: ReactNode;
}) {
  const embed = project.videoUrl ? videoEmbedUrl(project.videoUrl) : null;
  const facts: [string, string][] = [
    ['Role', project.role],
    ['Year', project.year ? String(project.year) : ''],
    ['Stack', project.stack.join(', ')],
    ['Status', PROJECT_STATUS_LABEL[project.status]],
  ];

  return (
    <article className="flex flex-col gap-gutter">
      <Link href="/projects" className="self-start text-[17px] font-bold underline">← All projects</Link>
      <div className="grid gap-gutter lg:grid-cols-6">
        <header
          className="flex flex-col gap-6 rounded-tile p-8 lg:col-span-2 lg:p-10"
          style={{ background: HEADER.bg, color: HEADER.fg }}
        >
          <span className="t-meta self-start rounded-pill border-[2px] border-current px-3 py-1.5">
            {projectCategoryLabel(project.category)}
          </span>
          <h1 className="t-title-l">{project.title}</h1>
          {project.oneLiner && <p className="t-body">{project.oneLiner}</p>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[17px]">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="t-meta self-center">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          {(project.githubUrl || project.demoUrl) && (
            <div className="mt-auto flex flex-wrap gap-2">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-pill px-5 font-bold" style={{ background: HEADER.btnBg, color: HEADER.btnFg }}>
                  GitHub ↗
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-pill px-5 font-bold" style={{ background: HEADER.btnBg, color: HEADER.btnFg }}>
                  Demo ↗
                </a>
              )}
            </div>
          )}
        </header>
        <div className="relative min-h-[320px] overflow-hidden rounded-tile bg-yellow lg:col-span-4 lg:min-h-[560px]">
          {embed ? (
            <iframe
              src={embed}
              title={`${project.title} video`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : project.coverUrl ? (
            <Image src={project.coverUrl} alt={project.coverAlt} fill priority sizes="(max-width: 1023px) 100vw, 66vw" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[160px] leading-none font-extrabold text-ink">
              {project.title.slice(0, 1)}
            </div>
          )}
        </div>
      </div>
      {bodyHtml && (
        <div className="rounded-tile border-[2.5px] border-ink bg-paper px-6 py-10 lg:px-10 lg:py-14">
          <div className="prose-site mx-auto max-w-[68ch]" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>
      )}
      {project.nextSlug && (
        <Link href={`/projects/${project.nextSlug}`} className="tile-link flex items-end justify-between gap-6 rounded-tile bg-ink p-8 text-cream lg:p-10">
          <div>
            <div className="t-meta mb-2">Next project →</div>
            <div className="t-title-m">{project.nextTitle}</div>
          </div>
          <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-cream text-[24px] text-ink">→</span>
        </Link>
      )}
      {footer}
    </article>
  );
}

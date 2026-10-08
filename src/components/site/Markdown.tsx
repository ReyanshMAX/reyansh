import 'katex/dist/katex.min.css';
import type { JSX } from 'react';
import { renderMarkdown } from '@/lib/markdown';

// Server component. The HTML comes from our own pipeline (no raw HTML, filtered URLs).
export async function Markdown({ source }: { source: string }): Promise<JSX.Element> {
  const html = await renderMarkdown(source);
  return <div className="prose-site" dangerouslySetInnerHTML={{ __html: html }} />;
}

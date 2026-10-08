'use server';

import { renderMarkdown, renderMarkdownWithToc, type TocEntry } from '@/lib/markdown';
import { requireOwner } from './auth';

// Editor preview (docs/DASHBOARD.md "MarkdownEditor"): same pipeline as the public site.
export async function renderMarkdownPreview(md: string): Promise<string> {
  try {
    await requireOwner();
    if (typeof md !== 'string' || md.length > 200_000) return '';
    return await renderMarkdown(md);
  } catch {
    return '';
  }
}

// Post editor Preview modal: HTML plus the "On this page" headings.
export async function renderPostPreview(md: string): Promise<{ html: string; toc: TocEntry[] }> {
  try {
    await requireOwner();
    if (typeof md !== 'string' || md.length > 200_000 || !md.trim()) return { html: '', toc: [] };
    return await renderMarkdownWithToc(md);
  } catch {
    return { html: '', toc: [] };
  }
}

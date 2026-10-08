'use server';

import { renderMarkdown } from '@/lib/markdown';
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

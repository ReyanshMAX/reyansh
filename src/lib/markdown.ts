import 'server-only';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';

// Raw HTML in the source is shown as literal text, never parsed (docs/UI.md, Phase 3).
const htmlAsText: Plugin = () => (tree: Node) => {
  visit(tree, 'html', (node: Node & { value?: string }) => {
    (node as { type: string }).type = 'text';
  });
};

// Only http(s), mailto, in-page and relative URLs survive in href/src.
const SAFE_URL = /^(https?:|mailto:|#|\/(?!\/)|\.{0,2}\/|[^:]*$)/i;
const safeUrls: Plugin = () => (tree: Node) => {
  visit(tree, 'element', (node: Node & { properties?: Record<string, unknown> }) => {
    const props = node.properties;
    if (!props) return;
    for (const key of ['href', 'src']) {
      const v = props[key];
      if (typeof v === 'string' && !SAFE_URL.test(v.trim())) delete props[key];
    }
  });
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(htmlAsText)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeSlug)
  .use(rehypePrettyCode, { theme: 'github-dark', keepBackground: false })
  .use(safeUrls)
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<string> {
  return String(await processor.process(source));
}

export function wordCount(source: string): number {
  return source.split(/\s+/).filter(Boolean).length;
}

export function readMinutes(source: string): number {
  return Math.max(1, Math.round(wordCount(source) / 220));
}

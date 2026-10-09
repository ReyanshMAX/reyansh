import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPost } from '@/components/site/BlogPost';
import { Footer } from '@/components/site/Footer';
import { renderMarkdownWithToc } from '@/lib/markdown';
import { pageMetadata } from '@/lib/site';
import { getLivePost, listLivePosts } from '@/server/queries';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listLivePosts({ limit: 1000, offset: 0 })).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getLivePost((await params).slug);
  if (!post) return { title: 'Not found — Reyansh Rastogi' };
  const meta = pageMetadata(post.title, { description: post.excerpt, coverUrl: post.coverUrl });
  return { ...meta, openGraph: { ...meta.openGraph, type: 'article', publishedTime: post.publishedAt } };
}

export default async function BlogPostPage({ params }: PageProps<'/blog/[slug]'>) {
  const post = await getLivePost((await params).slug);
  if (!post) notFound();
  const { html, toc } = post.bodyMd.trim() ? await renderMarkdownWithToc(post.bodyMd) : { html: '', toc: [] };
  return <BlogPost post={post} bodyHtml={html} toc={toc} footer={<Footer />} />;
}

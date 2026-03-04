'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Loader2, ArrowLeft, Link2, Share2 } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  readTime: number | null;
  publishedAt: string | null;
  author: {
    name: string | null;
    avatarUrl: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

type RelatedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readTime: number | null;
  publishedAt: string | null;
  categories: Array<{
    name: string;
  }>;
};

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseContent = (content: string): { elements: ReactNode[]; toc: TocItem[] } => {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  const listItems: string[] = [];
  const codeLines: string[] = [];
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();
  let inCodeBlock = false;
  let key = 0;

  const nextHeadingId = (title: string): string => {
    const base = toSlug(title) || `section-${key}`;
    const count = (usedIds.get(base) || 0) + 1;
    usedIds.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={`list-${key++}`} className="list-disc space-y-2 pl-6 text-brand-muted">
        {listItems.map((item, index) => (
          <li key={`list-item-${key++}-${index}`}>{item}</li>
        ))}
      </ul>
    );
    listItems.length = 0;
  };

  const flushCodeBlock = () => {
    if (codeLines.length === 0) return;
    elements.push(
      <pre
        key={`code-${key++}`}
        className="overflow-x-auto rounded-xl border ui-border bg-brand-background/70 p-4 text-sm text-brand-text"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
    codeLines.length = 0;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) flushCodeBlock();
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();

    if (!trimmed) continue;

    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s+/, '');
      const id = nextHeadingId(text);
      toc.push({ id, text, level: 3 });
      elements.push(
        <h3 id={id} key={`h3-${key++}`} className="mt-6 scroll-mt-24 text-xl font-semibold text-brand-text">
          {text}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const text = trimmed.replace(/^##\s+/, '');
      const id = nextHeadingId(text);
      toc.push({ id, text, level: 2 });
      elements.push(
        <h2 id={id} key={`h2-${key++}`} className="mt-8 scroll-mt-24 text-2xl font-semibold text-brand-text">
          {text}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      const text = trimmed.replace(/^#\s+/, '');
      const id = nextHeadingId(text);
      elements.push(
        <h1 id={id} key={`h1-${key++}`} className="mt-10 scroll-mt-24 text-3xl font-bold text-brand-text">
          {text}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${key++}`}
          className="border-l-4 border-brand-primary/70 pl-4 italic text-brand-muted"
        >
          {trimmed.replace(/^>\s+/, '')}
        </blockquote>
      );
      continue;
    }

    elements.push(
      <p key={`p-${key++}`} className="leading-7 text-brand-muted">
        {trimmed}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return { elements, toc };
};

export default function BlogPostPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const isPreview = ['1', 'true', 'yes'].includes((searchParams.get('preview') || '').toLowerCase());

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    const fetchPostAndRelated = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const previewQuery = isPreview ? '?preview=1' : '';
        const postRes = await fetch(`/api/blog/${slug}${previewQuery}`);

        if (!postRes.ok) {
          setPost(null);
          setRelatedPosts([]);
          return;
        }

        const postData: BlogPost = await postRes.json();
        setPost(postData);

        const primaryCategory = postData.categories[0]?.slug;
        if (!primaryCategory) {
          setRelatedPosts([]);
          return;
        }

        const relatedRes = await fetch(`/api/blog?category=${encodeURIComponent(primaryCategory)}&limit=4`);
        if (!relatedRes.ok) {
          setRelatedPosts([]);
          return;
        }

        const relatedData = await relatedRes.json();
        const filteredRelated = (Array.isArray(relatedData.data) ? relatedData.data : [])
          .filter((item: RelatedPost) => item.slug !== postData.slug)
          .slice(0, 3);

        setRelatedPosts(filteredRelated);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setPost(null);
        setRelatedPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndRelated();
  }, [slug, isPreview]);

  const parsed = useMemo(() => parseContent(post?.content || ''), [post?.content]);

  const getPostUrl = () => {
    if (!post) return '';
    if (typeof window === 'undefined') return '';
    const url = new URL(`/blog/${post.slug}`, window.location.origin);
    if (isPreview) url.searchParams.set('preview', '1');
    return url.toString();
  };

  const handleShare = async (channel: 'x' | 'linkedin' | 'copy' | 'native') => {
    if (!post || typeof window === 'undefined') return;
    const url = getPostUrl();
    const text = post.title;

    try {
      if (channel === 'copy') {
        await navigator.clipboard.writeText(url);
        setShareNotice('Link copied');
        return;
      }

      if (channel === 'x') {
        const target = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(target, '_blank', 'noopener,noreferrer');
        return;
      }

      if (channel === 'linkedin') {
        const target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(target, '_blank', 'noopener,noreferrer');
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNotice('Link copied');
      }
    } catch (error) {
      console.error('Share failed:', error);
      setShareNotice('Share failed');
    }
  };

  useEffect(() => {
    if (!shareNotice) return;
    const timer = setTimeout(() => setShareNotice(''), 1800);
    return () => clearTimeout(timer);
  }, [shareNotice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Blog post not found</h1>
        <p className="mt-2 text-brand-muted">The article you are looking for does not exist.</p>
        <Link href="/blog" className="mt-4 inline-block text-brand-primary hover:underline">
          Browse all articles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text">
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      {isPreview && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
          Preview Mode: this draft is visible only to admins.
        </div>
      )}

      <article>
        <header className="mb-8">
          <div className="mb-4 flex gap-2">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className="rounded-full border ui-border px-3 py-1 text-xs text-brand-muted hover:text-brand-text"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <h1 className="text-4xl font-bold">{post.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
            <div className="flex items-center gap-2">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name || 'Author'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20">
                  {post.author.name?.charAt(0) || 'A'}
                </div>
              )}
              <span>{post.author.name || 'Author'}</span>
            </div>
            {post.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </div>
            )}
            {post.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime} min read
              </div>
            )}
          </div>
        </header>

        {parsed.toc.length > 0 && (
          <aside className="ui-card mb-8 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Table of Contents</h2>
            <div className="mt-3 space-y-1">
              {parsed.toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`block text-sm text-brand-muted hover:text-brand-text ${item.level === 3 ? 'pl-4' : ''}`}
                >
                  {item.text}
                </a>
              ))}
            </div>
          </aside>
        )}

        {post.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img src={post.featuredImage} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        <div className="space-y-4">{parsed.elements}</div>

        <div className="mt-12 border-t ui-border pt-8">
          <p className="font-medium">Share this article</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => handleShare('x')}
              className="rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm hover:bg-brand-primary/15"
            >
              X
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm hover:bg-brand-primary/15"
            >
              LinkedIn
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="inline-flex items-center gap-1 rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm hover:bg-brand-primary/15"
            >
              <Link2 className="h-4 w-4" />
              Copy Link
            </button>
            <button
              onClick={() => handleShare('native')}
              className="inline-flex items-center gap-1 rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm hover:bg-brand-primary/15"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
          {shareNotice && <p className="mt-3 text-xs text-brand-muted">{shareNotice}</p>}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="mt-12 border-t ui-border pt-8">
          <h2 className="text-2xl font-semibold">Related Posts</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="ui-card p-4 transition hover:border-brand-primary/60"
              >
                <p className="text-xs text-brand-muted">
                  {related.publishedAt ? new Date(related.publishedAt).toLocaleDateString() : ''}
                </p>
                <h3 className="mt-2 font-medium">{related.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-brand-muted">
                  {related.excerpt || 'Read this article for more details.'}
                </p>
                <p className="mt-3 text-xs text-brand-muted">{related.readTime || 5} min read</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

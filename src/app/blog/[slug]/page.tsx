'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Loader2, ArrowLeft } from 'lucide-react';

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

const renderRichContent = (content: string): ReactNode[] => {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  const listItems: string[] = [];
  const codeLines: string[] = [];
  let inCodeBlock = false;
  let key = 0;

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
        className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-100"
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
      if (inCodeBlock) {
        flushCodeBlock();
      }
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

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${key++}`} className="mt-6 text-xl font-semibold text-white">
          {trimmed.replace(/^###\s+/, '')}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${key++}`} className="mt-8 text-2xl font-semibold text-white">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${key++}`} className="mt-10 text-3xl font-bold text-white">
          {trimmed.replace(/^#\s+/, '')}
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

  return elements;
};

export default function BlogPostPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostAndRelated = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const postRes = await fetch(`/api/blog/${slug}`);

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

        const relatedRes = await fetch(
          `/api/blog?category=${encodeURIComponent(primaryCategory)}&limit=4`
        );
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
  }, [slug]);

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
      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-brand-muted hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <article>
        <header className="mb-8">
          <div className="mb-4 flex gap-2">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-brand-muted hover:text-white"
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

        {post.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img src={post.featuredImage} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        <div className="space-y-4">{renderRichContent(post.content)}</div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="font-medium">Share this article</p>
          <div className="mt-4 flex gap-4">
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Twitter
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              LinkedIn
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
              Copy Link
            </button>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-semibold">Related Posts</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="rounded-xl border border-white/10 bg-brand-surface p-4 transition hover:border-brand-primary/60"
              >
                <p className="text-xs text-brand-muted">
                  {related.publishedAt ? new Date(related.publishedAt).toLocaleDateString() : ''}
                </p>
                <h3 className="mt-2 font-medium">{related.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-brand-muted">
                  {related.excerpt || 'Read this article for more details.'}
                </p>
                <p className="mt-3 text-xs text-brand-muted">
                  {related.readTime || 5} min read
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

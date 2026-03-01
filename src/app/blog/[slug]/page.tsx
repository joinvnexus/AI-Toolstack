'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User, Loader2, ArrowLeft } from 'lucide-react';

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

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

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
        {/* Header */}
        <header className="mb-8">
          <div className="flex gap-2 mb-4">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20">
                {post.author.name?.charAt(0) || 'A'}
              </div>
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

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="text-brand-muted">{paragraph}</p>
          ))}
        </div>

        {/* Share */}
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
    </div>
  );
}

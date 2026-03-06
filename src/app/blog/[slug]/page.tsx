'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Loader2, ArrowLeft, Link2, Share2, Pencil, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

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

type BlogComment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
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
        <h2 id={id} key={`h1-${key++}`} className="mt-10 scroll-mt-24 text-2xl font-semibold text-brand-text">
          {text}
        </h2>
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
  const supabase = createClient();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const isPreview = ['1', 'true', 'yes'].includes((searchParams.get('preview') || '').toLowerCase());

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentActionLoadingId, setCommentActionLoadingId] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser ?? null);
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    const fetchPostAndRelated = async () => {
      if (!slug) {
        setLoading(false);
        setCommentsLoading(false);
        return;
      }

      setLoading(true);
      setCommentsLoading(true);
      try {
        const previewQuery = isPreview ? '?preview=1' : '';
        const [postRes, commentsRes] = await Promise.all([
          fetch(`/api/blog/${slug}${previewQuery}`),
          fetch(`/api/blog/${slug}/comments?limit=50`),
        ]);

        if (!postRes.ok) {
          setPost(null);
          setRelatedPosts([]);
          setComments([]);
          setCommentsLoading(false);
          return;
        }

        const postData: BlogPost = await postRes.json();
        setPost(postData);

        if (commentsRes.ok) {
          const commentData = await commentsRes.json();
          setComments(Array.isArray(commentData.data) ? commentData.data : []);
        } else {
          setComments([]);
        }
        setCommentsLoading(false);

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
        setComments([]);
        setCommentsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndRelated();
  }, [slug, isPreview]);

  const parsed = useMemo(() => parseContent(post?.content || ''), [post?.content]);

  const formatCommentDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = commentContent.trim();

    if (!content) {
      setCommentError('Comment cannot be empty');
      setCommentSuccess('');
      return;
    }

    if (!post) return;

    setCommentSubmitting(true);
    setCommentError('');
    setCommentSuccess('');

    try {
      const response = await fetch(`/api/blog/${post.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCommentError(data.error || 'Failed to post comment');
        return;
      }

      setComments((current) => [data, ...current]);
      setCommentContent('');
      setCommentSuccess('Comment posted');
    } catch (error) {
      console.error('Error posting comment:', error);
      setCommentError('Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleStartEdit = (comment: BlogComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setCommentError('');
    setCommentSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleUpdateComment = async (commentId: string) => {
    const content = editingContent.trim();
    if (!post) return;
    if (!content) {
      setCommentError('Comment cannot be empty');
      return;
    }

    setCommentActionLoadingId(commentId);
    setCommentError('');
    setCommentSuccess('');

    try {
      const response = await fetch(`/api/blog/${post.slug}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) {
        setCommentError(data.error || 'Failed to update comment');
        return;
      }

      setComments((current) => current.map((item) => (item.id === commentId ? data : item)));
      setEditingCommentId(null);
      setEditingContent('');
      setCommentSuccess('Comment updated');
    } catch (error) {
      console.error('Error updating comment:', error);
      setCommentError('Failed to update comment');
    } finally {
      setCommentActionLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    if (!confirm('Delete this comment?')) return;

    setCommentActionLoadingId(commentId);
    setCommentError('');
    setCommentSuccess('');

    try {
      const response = await fetch(`/api/blog/${post.slug}/comments/${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        setCommentError(data.error || 'Failed to delete comment');
        return;
      }

      setComments((current) => current.filter((item) => item.id !== commentId));
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingContent('');
      }
      setCommentSuccess('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setCommentError('Failed to delete comment');
    } finally {
      setCommentActionLoadingId(null);
    }
  };

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
    <div className="mx-auto max-w-5xl">
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
          <div className="mb-4 flex flex-wrap gap-2">
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

          <h1 className="break-words text-3xl font-bold sm:text-4xl md:text-5xl">{post.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted">
              <div className="flex items-center gap-2">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name || 'Author'}
                    width={32}
                    height={32}
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
          <aside className="ui-card mb-8 p-4 sm:p-5">
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
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-4 break-words text-[15px] sm:text-base">{parsed.elements}</div>

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

        <section className="mt-12 border-t ui-border pt-8">
          <h2 className="text-2xl font-semibold">Comments</h2>
          <p className="mt-2 text-sm text-brand-muted">Join the discussion about this article.</p>

          {user ? (
            <form onSubmit={handleCommentSubmit} className="ui-card mt-4 p-4 sm:p-5">
              <label htmlFor="comment-content" className="mb-2 block text-sm font-medium">
                Add your comment
              </label>
              <textarea
                id="comment-content"
                value={commentContent}
                onChange={(event) => {
                  setCommentContent(event.target.value);
                  setCommentError('');
                  setCommentSuccess('');
                }}
                rows={4}
                maxLength={2000}
                placeholder="Write your thoughts..."
                className="ui-input w-full"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-brand-muted">{commentContent.trim().length}/2000</p>
                <button type="submit" disabled={commentSubmitting} className="ui-btn ui-btn-primary disabled:opacity-60">
                  {commentSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post comment'
                  )}
                </button>
              </div>
              {commentError && <p className="mt-2 text-sm text-red-500">{commentError}</p>}
              {commentSuccess && <p className="mt-2 text-sm text-emerald-500">{commentSuccess}</p>}
            </form>
          ) : (
            <div className="ui-card mt-4 p-4 sm:p-5">
              <p className="text-sm text-brand-muted">
                <Link href="/login" className="text-brand-primary hover:underline">
                  Sign in
                </Link>{' '}
                to write a comment.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {commentsLoading ? (
              <div className="ui-card p-5 text-sm text-brand-muted">Loading comments...</div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="ui-card p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    {comment.user.avatarUrl ? (
                      <Image
                        src={comment.user.avatarUrl}
                        alt={comment.user.name || 'User'}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-primary">
                        {(comment.user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{comment.user.name || 'User'}</p>
                      <p className="text-xs text-brand-muted">{formatCommentDate(comment.createdAt)}</p>
                    </div>
                    {user?.id === comment.user.id && (
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="ui-btn ui-btn-ghost !min-h-8 !rounded-lg !px-2 !py-1 text-xs"
                          aria-label="Edit comment"
                          disabled={commentActionLoadingId === comment.id}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="ui-btn ui-btn-ghost !min-h-8 !rounded-lg !px-2 !py-1 text-xs text-red-500"
                          aria-label="Delete comment"
                          disabled={commentActionLoadingId === comment.id}
                        >
                          {commentActionLoadingId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="ui-input w-full"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleUpdateComment(comment.id)}
                          className="ui-btn ui-btn-primary !rounded-lg !px-3 !py-1.5 text-xs"
                          disabled={commentActionLoadingId === comment.id}
                        >
                          {commentActionLoadingId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="ui-btn ui-btn-ghost !rounded-lg !px-3 !py-1.5 text-xs"
                          disabled={commentActionLoadingId === comment.id}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 whitespace-pre-line text-sm text-brand-muted">{comment.content}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="ui-card p-5 text-sm text-brand-muted">No comments yet. Be the first to comment.</div>
            )}
          </div>
        </section>
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

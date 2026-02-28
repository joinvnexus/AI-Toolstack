import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/constants/site';

type Props = { params: { slug: string } };

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts.find((item) => item.slug === params.slug);
  if (!post) return notFound();

  return (
    <article className="prose prose-invert max-w-3xl">
      <p className="text-sm text-brand-muted">{post.date} · {post.readTime}</p>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <p>
        This starter implementation provides the scaffolding for the AI Toolstack content engine. Connect this route to Prisma/Supabase
        content and a rich text renderer (e.g., TipTap or MDX) in the next phase.
      </p>
    </article>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  published: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type PostFormData = z.infer<typeof postSchema>;

type Category = {
  id: string;
  name: string;
};

type BlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  published: boolean;
  slug: string;
  categories: Array<{ id: string }>;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, categoriesRes] = await Promise.all([
          fetch(`/api/blog/${params.slug}`),
          fetch('/api/categories'),
        ]);

        if (postRes.ok) {
          const postData = await postRes.json();
          setPost(postData);
          setSelectedCategories(postData.categories?.map((c: { id: string }) => c.id) || []);
          reset({
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt || '',
            featuredImage: postData.featuredImage || '',
            published: postData.published,
          });
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchingData(false);
      }
    };

    if (params.slug) {
      fetchData();
    }
  }, [params.slug, reset]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${params.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          featuredImage: data.featuredImage || undefined,
          categoryIds: selectedCategories,
        }),
      });

      if (res.ok) {
        router.push('/admin/posts');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link href="/admin/posts" className="mt-4 inline-block text-brand-primary hover:underline">
          Back to posts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/posts"
          className="rounded-lg p-2 text-brand-muted hover:bg-brand-primary/15 hover:text-brand-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-brand-muted">Update "{post.title}"</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        <div className="ui-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              {...register('title')}
              type="text"
              placeholder="Enter post title"
              className="ui-input w-full"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              {...register('excerpt')}
              placeholder="Brief summary of the post"
              rows={2}
              className="ui-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Featured Image URL</label>
            <input
              {...register('featuredImage')}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="ui-input w-full"
            />
            {errors.featuredImage && (
              <p className="mt-1 text-sm text-red-500">{errors.featuredImage.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    selectedCategories.includes(category.id)
                      ? 'border-brand-primary bg-brand-primary/20 text-brand-primary'
                      : 'ui-border text-brand-muted hover:border-brand-primary/40'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('published')}
              type="checkbox"
              id="published"
              className="h-4 w-4 rounded ui-border bg-brand-background/40 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="published" className="text-sm font-medium">
              Published
            </label>
          </div>
        </div>

        <div className="ui-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              {...register('content')}
              placeholder="Write your post content here... (Markdown supported)"
              rows={15}
              className="ui-input w-full font-mono"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/posts"
            className="rounded-lg border ui-border bg-brand-primary/10 px-4 py-2 text-sm font-medium hover:bg-brand-primary/15"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}


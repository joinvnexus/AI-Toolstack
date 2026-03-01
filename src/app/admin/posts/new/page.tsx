'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      published: false,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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
      const res = await fetch('/api/blog', {
        method: 'POST',
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
        alert(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCategories) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/posts"
          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Write New Post</h1>
          <p className="text-brand-muted">Create a new blog article</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        <div className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              {...register('title')}
              type="text"
              placeholder="Enter post title"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
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
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Featured Image URL</label>
            <input
              {...register('featuredImage')}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
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
                      : 'border-white/10 text-brand-muted hover:border-white/30'
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
              className="h-4 w-4 rounded border-white/20 bg-black/20 text-brand-primary focus:ring-brand-primary"
            />
            <label htmlFor="published" className="text-sm font-medium">
              Publish immediately
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              {...register('content')}
              placeholder="Write your post content here... (Markdown supported)"
              rows={15}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted font-mono"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/posts"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
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
            Save Post
          </button>
        </div>
      </form>
    </div>
  );
}

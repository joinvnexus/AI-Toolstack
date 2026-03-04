'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .regex(slugRegex, 'Slug must contain lowercase letters, numbers, and hyphens only')
    .optional()
    .or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  featuredImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  published: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional()
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
  const [submitError, setSubmitError] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      published: false,
      slug: ''
    }
  });

  const titleValue = watch('title');
  const slugRegistration = register('slug', {
    onChange: () => setSlugTouched(true)
  });

  useEffect(() => {
    if (slugTouched) return;
    setValue('slug', toSlug(titleValue || ''), { shouldValidate: true });
  }, [titleValue, slugTouched, setValue]);

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
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          slug: data.slug?.trim() || undefined,
          featuredImage: data.featuredImage || undefined,
          categoryIds: selectedCategories
        })
      });

      if (res.ok) {
        router.push('/admin/posts');
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setSubmitError('Failed to create post');
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
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="rounded-lg p-2 text-brand-muted hover:bg-brand-primary/15 hover:text-brand-text">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Write New Post</h1>
          <p className="text-brand-muted">Create a new blog article</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
        <div className="ui-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">Title *</label>
            <input {...register('title')} type="text" placeholder="Enter post title" className="ui-input w-full" />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Slug</label>
            <input {...slugRegistration} type="text" placeholder="my-post-slug" className="ui-input w-full" />
            <p className="mt-1 text-xs text-brand-muted">URL: `/blog/{watch('slug') || 'my-post-slug'}`</p>
            {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Excerpt</label>
            <textarea {...register('excerpt')} placeholder="Brief summary of the post" rows={2} className="ui-input w-full" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Featured Image URL</label>
            <input
              {...register('featuredImage')}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="ui-input w-full"
            />
            {errors.featuredImage && <p className="mt-1 text-sm text-red-500">{errors.featuredImage.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Categories</label>
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
              Publish immediately
            </label>
          </div>
        </div>

        <div className="ui-card space-y-4 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Content *</label>
            <textarea
              {...register('content')}
              placeholder="Write your post content here... (Markdown supported)"
              rows={15}
              className="ui-input w-full font-mono"
            />
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>}
          </div>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{submitError}</div>
        )}

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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Post
          </button>
        </div>
      </form>
    </div>
  );
}

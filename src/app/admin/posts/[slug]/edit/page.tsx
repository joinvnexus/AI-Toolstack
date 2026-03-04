'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save, RefreshCw } from 'lucide-react';

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

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  published: boolean;
  categories: Array<{ id: string }>;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      slug: ''
    }
  });

  const titleValue = watch('title');
  const currentSlug = watch('slug');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, categoriesRes] = await Promise.all([
          fetch(`/api/blog/${slug}?preview=1`),
          fetch('/api/categories')
        ]);

        if (postRes.ok) {
          const postData = await postRes.json();
          setPost(postData);
          setSelectedCategories(postData.categories?.map((c: { id: string }) => c.id) || []);
          reset({
            title: postData.title,
            slug: postData.slug,
            content: postData.content,
            excerpt: postData.excerpt || '',
            featuredImage: postData.featuredImage || '',
            published: postData.published
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

    if (slug) {
      fetchData();
    }
  }, [slug, reset]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const regenerateSlug = () => {
    setValue('slug', toSlug(titleValue || ''), { shouldValidate: true });
  };

  const onSubmit = async (data: PostFormData) => {
    setLoading(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: 'PUT',
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
        setSubmitError(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setSubmitError('Failed to update post');
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
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="rounded-lg p-2 text-brand-muted hover:bg-brand-primary/15 hover:text-brand-text">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-brand-muted">Update "{post.title}"</p>
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium">Slug</label>
              <button
                type="button"
                onClick={regenerateSlug}
                className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
            <input {...register('slug')} type="text" placeholder="my-post-slug" className="ui-input w-full" />
            <p className="mt-1 text-xs text-brand-muted">URL: `/blog/{currentSlug || 'my-post-slug'}`</p>
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
              Published
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
              className="ui-input w-full"
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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

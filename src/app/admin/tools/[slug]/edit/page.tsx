'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const toolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  longDescription: z.string().optional(),
  overview: z.string().optional(),
  features: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  pricingDetails: z.string().optional(),
  alternativeTools: z.string().optional(),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  conclusion: z.string().optional(),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pricingModel: z.enum(['FREE', 'PAID', 'FREEMIUM']),
  priceRange: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
});

type ToolFormData = z.infer<typeof toolSchema>;

type Category = {
  id: string;
  name: string;
};

type Tool = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  overview: string | null;
  features: string[];
  pros: string[];
  cons: string[];
  pricingDetails: string | null;
  alternativeTools: string[];
  videoUrl: string | null;
  conclusion: string | null;
  logoUrl: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  pricingModel: string;
  priceRange: string | null;
  categoryId: string;
};

const parseListInput = (value?: string) =>
  (value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const buildLongDescription = (data: ToolFormData) => {
  const sections: string[] = [];

  if (data.overview?.trim()) {
    sections.push(`Overview\n${data.overview.trim()}`);
  }

  const features = parseListInput(data.features);
  if (features.length > 0) {
    sections.push(`Features\n${features.map((item) => `- ${item}`).join('\n')}`);
  }

  const pros = parseListInput(data.pros);
  if (pros.length > 0) {
    sections.push(`Pros\n${pros.map((item) => `- ${item}`).join('\n')}`);
  }

  const cons = parseListInput(data.cons);
  if (cons.length > 0) {
    sections.push(`Cons\n${cons.map((item) => `- ${item}`).join('\n')}`);
  }

  if (data.pricingDetails?.trim()) {
    sections.push(`Pricing Details\n${data.pricingDetails.trim()}`);
  }

  const alternatives = parseListInput(data.alternativeTools);
  if (alternatives.length > 0) {
    sections.push(`Alternative Tools\n${alternatives.map((item) => `- ${item}`).join('\n')}`);
  }

  if (data.videoUrl?.trim()) {
    sections.push(`Video\n${data.videoUrl.trim()}`);
  }

  if (data.conclusion?.trim()) {
    sections.push(`Conclusion\n${data.conclusion.trim()}`);
  }

  return sections.join('\n\n').trim();
};

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [tool, setTool] = useState<Tool | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      pricingModel: 'FREE',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setFetchingData(false);
        return;
      }

      try {
        const [toolRes, categoriesRes] = await Promise.all([
          fetch(`/api/tools/${slug}`),
          fetch('/api/categories'),
        ]);

        if (toolRes.ok) {
          const toolData: Tool = await toolRes.json();
          setTool(toolData);
          reset({
            name: toolData.name,
            description: toolData.description,
            longDescription: toolData.longDescription || '',
            overview: toolData.overview || '',
            features: (toolData.features || []).join('\n'),
            pros: (toolData.pros || []).join('\n'),
            cons: (toolData.cons || []).join('\n'),
            pricingDetails: toolData.pricingDetails || '',
            alternativeTools: (toolData.alternativeTools || []).join('\n'),
            videoUrl: toolData.videoUrl || '',
            conclusion: toolData.conclusion || '',
            logoUrl: toolData.logoUrl || '',
            websiteUrl: toolData.websiteUrl,
            affiliateUrl: toolData.affiliateUrl || '',
            pricingModel: toolData.pricingModel as 'FREE' | 'PAID' | 'FREEMIUM',
            priceRange: toolData.priceRange || '',
            categoryId: toolData.categoryId,
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

    fetchData();
  }, [slug, reset]);

  const onSubmit = async (data: ToolFormData) => {
    if (!slug) return;

    setLoading(true);
    const compiledLongDescription = buildLongDescription(data);

    try {
      const res = await fetch(`/api/tools/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          overview: data.overview?.trim() || undefined,
          features: parseListInput(data.features),
          pros: parseListInput(data.pros),
          cons: parseListInput(data.cons),
          pricingDetails: data.pricingDetails?.trim() || undefined,
          alternativeTools: parseListInput(data.alternativeTools),
          videoUrl: data.videoUrl?.trim() || undefined,
          conclusion: data.conclusion?.trim() || undefined,
          logoUrl: data.logoUrl || undefined,
          websiteUrl: data.websiteUrl,
          affiliateUrl: data.affiliateUrl || undefined,
          pricingModel: data.pricingModel,
          priceRange: data.priceRange || undefined,
          categoryId: data.categoryId,
          longDescription:
            compiledLongDescription || data.longDescription?.trim() || data.description,
        }),
      });

      if (res.ok) {
        router.push('/admin/tools');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update tool');
      }
    } catch (error) {
      console.error('Error updating tool:', error);
      alert('Failed to update tool');
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

  if (!tool) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <Link href="/admin/tools" className="mt-4 inline-block text-brand-primary hover:underline">
          Back to tools
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tools"
          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Tool</h1>
          <p className="text-brand-muted">Update "{tool.name}" details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="space-y-4 rounded-xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">Tool Name *</label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., ChatGPT, Midjourney"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Short Description *</label>
            <textarea
              {...register('description')}
              placeholder="Brief description (1-2 sentences)"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Fallback Long Description</label>
            <textarea
              {...register('longDescription')}
              placeholder="Used only if section fields below are empty"
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Category *</label>
            <select
              {...register('categoryId')}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-lg font-semibold">Pricing & Links</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Pricing Model *</label>
              <select
                {...register('pricingModel')}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary"
              >
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="FREEMIUM">Freemium</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Price Range</label>
              <input
                {...register('priceRange')}
                type="text"
                placeholder="e.g., $10-30/month"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Website URL *</label>
            <input
              {...register('websiteUrl')}
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.websiteUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Logo URL</label>
            <input
              {...register('logoUrl')}
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.logoUrl && <p className="mt-1 text-sm text-red-500">{errors.logoUrl.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Affiliate URL</label>
            <input
              {...register('affiliateUrl')}
              type="url"
              placeholder="https://example.com/affiliate"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.affiliateUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.affiliateUrl.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-lg font-semibold">Detailed Content Sections</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">Overview</label>
            <textarea
              {...register('overview')}
              placeholder="High-level summary of what the tool does"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Features</label>
              <textarea
                {...register('features')}
                placeholder={"One feature per line\ne.g., AI chat\nCode generation"}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Alternative Tools</label>
              <textarea
                {...register('alternativeTools')}
                placeholder={"One alternative per line\ne.g., Claude\nGemini"}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Pros</label>
              <textarea
                {...register('pros')}
                placeholder={"One pro per line\ne.g., Fast responses"}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Cons</label>
              <textarea
                {...register('cons')}
                placeholder={"One con per line\ne.g., Limited free tier"}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Pricing Details</label>
            <textarea
              {...register('pricingDetails')}
              placeholder="Explain plans, limits, trial, and billing notes"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Video URL</label>
            <input
              {...register('videoUrl')}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
            {errors.videoUrl && <p className="mt-1 text-sm text-red-500">{errors.videoUrl.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Conclusion</label>
            <textarea
              {...register('conclusion')}
              placeholder="Final verdict and who should use this tool"
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/tools"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAdminCheck } from '@/lib/hooks/use-admin-check';
import { Loader2, Plus, Search, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: string;
  rating: number;
  reviewCount: number;
  views: number;
  category: {
    name: string;
  };
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminToolsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: adminLoading, user } = useAdminCheck();
  const supabase = createClient();
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      return;
    }

    const fetchData = async () => {
      try {
        const [toolsRes, categoriesRes] = await Promise.all([
          fetch('/api/tools?limit=100'),
          fetch('/api/categories'),
        ]);

        if (toolsRes.ok) {
          const toolsData = await toolsRes.json();
          setTools(toolsData.data || []);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminLoading, isAdmin]);

  const handleDelete = async (tool: Tool) => {
    if (!confirm(`Are you sure you want to delete "${tool.name}"?`)) {
      return;
    }

    setDeleting(tool.id);
    try {
      const res = await fetch(`/api/tools/${tool.slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTools(tools.filter((t) => t.id !== tool.id));
      } else {
        alert('Failed to delete tool');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Failed to delete tool');
    } finally {
      setDeleting(null);
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format pricing model
  const formatPricing = (model: string) => {
    const models: Record<string, string> = {
      FREE: 'Free',
      PAID: 'Paid',
      FREEMIUM: 'Freemium',
    };
    return models[model] || model;
  };

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-brand-muted">You don't have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Tools</h1>
          <p className="text-brand-muted">Add, edit, or remove AI tools from the directory</p>
        </div>
        <Link
          href="/admin/tools/new"
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add New Tool
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-brand-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
        />
      </div>

      {/* Tools Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Pricing</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Reviews</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length > 0 ? (
                filteredTools.map((tool) => (
                  <tr key={tool.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="max-w-xs truncate text-sm text-brand-muted">{tool.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="rounded-full bg-white/5 px-2 py-1 text-xs">
                        {tool.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatPricing(tool.pricingModel)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{tool.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">{tool.reviewCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/tools/${tool.slug}/edit`}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(tool)}
                          disabled={deleting === tool.id}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === tool.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    {searchQuery ? 'No tools found matching your search.' : 'No tools yet. Add your first tool!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

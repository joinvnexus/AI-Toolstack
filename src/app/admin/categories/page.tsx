'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Search, Edit, Trash2 } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  toolCount: number;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    setDeleting(category.id);
    try {
      const res = await fetch(`/api/categories/${category.slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== category.id));
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.slug}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        fetchCategories();
        reset();
        setShowForm(false);
        setEditingCategory(null);
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    reset();
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Categories</h1>
          <p className="text-brand-muted">Organize tools and blog posts with categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g., Productivity, Design"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                {...register('description')}
                placeholder="Brief description"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Icon (emoji or name)</label>
              <input
                {...register('icon')}
                type="text"
                placeholder="e.g., ⚡, 💻"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-brand-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-white/10 bg-brand-surface p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-brand-muted">{category.toolCount} tools</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={deleting === category.id}
                    className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-red-500 disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === category.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="mt-3 text-sm text-brand-muted">{category.description}</p>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-white/10 bg-brand-surface p-8 text-center">
            <p className="text-brand-muted">
              {searchQuery ? 'No categories found.' : 'No categories yet. Add your first category!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

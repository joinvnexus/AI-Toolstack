interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />
  );
}

export function ToolCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-4 w-24" />
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-6 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ToolDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

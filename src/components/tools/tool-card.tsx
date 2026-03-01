'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Tool } from '@/lib/constants/site';

interface ToolCardProps {
  tool: Tool;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

export function ToolCard({ tool, showBookmark = false, isBookmarked = false, onBookmarkToggle }: ToolCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-white/10 bg-brand-surface p-5 transition-colors hover:border-brand-primary/70"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-brand-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-medium group-hover:text-brand-primary transition-colors">
              {tool.name}
            </h3>
            <span className="mt-1 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-brand-muted">
              {tool.category}
            </span>
          </div>
          
          {showBookmark && onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmarkToggle();
              }}
              className="rounded-lg p-1.5 text-brand-muted hover:bg-white/10 hover:text-brand-primary transition-colors"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </button>
          )}
        </div>
        
        <p className="text-sm text-brand-muted line-clamp-2">{tool.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {tool.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-brand-muted"
            >
              {feature}
            </span>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium text-brand-secondary">
            {tool.pricing}
          </span>
          <span className="text-brand-muted">
            ⭐ {tool.rating.toFixed(1)} <span className="opacity-60">({tool.reviews})</span>
          </span>
        </div>
        
        <Link
          href={`/tools/${tool.slug}`}
          className="mt-4 inline-block text-sm font-medium text-brand-primary opacity-0 transition-all group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
        >
          View details →
        </Link>
      </div>
    </motion.article>
  );
}

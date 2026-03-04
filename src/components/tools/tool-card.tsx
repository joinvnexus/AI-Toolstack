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

export function ToolCard({
  tool,
  showBookmark = false,
  isBookmarked = false,
  onBookmarkToggle
}: ToolCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="ui-card group relative p-4 transition-colors sm:p-5 sm:hover:border-brand-primary/70"
    >
      <div className="absolute inset-0 rounded-2xl bg-brand-primary/5 opacity-0 transition-opacity sm:group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-base font-medium leading-tight transition-colors sm:text-lg sm:group-hover:text-brand-primary">
              {tool.name}
            </h3>
            <span className="ui-chip mt-1 inline-block">{tool.category}</span>
          </div>

          {showBookmark && onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmarkToggle();
              }}
              className="ui-ring rounded-lg p-1.5 text-brand-muted transition-colors hover:text-brand-primary"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
            </button>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-brand-muted sm:text-sm">{tool.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
          {tool.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="rounded-full border ui-border px-2 py-1 text-[11px] text-brand-muted sm:px-2.5 sm:text-xs"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:mt-4 sm:text-sm">
          <span className="font-medium text-brand-secondary">{tool.pricing}</span>
          <span className="text-brand-muted">
            {'\u2b50'} {tool.rating.toFixed(1)} <span className="opacity-60">({tool.reviews})</span>
          </span>
        </div>

        <Link
          href={`/tools/${tool.slug}`}
          className="mt-3 inline-flex items-center text-sm font-medium text-brand-primary transition-all sm:mt-4 sm:-translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        >
          View details &rarr;
        </Link>
      </div>
    </motion.article>
  );
}

import type { PricingModel } from '@/types';

export const siteConfig = {
  name: 'AI Toolstack',
  description:
    'Discover, review, compare, and learn about the best AI tools in one modern platform.',
  url: 'http://localhost:3000',
  keywords: ['AI tools', 'artificial intelligence', 'AI software', 'AI directory'],
  author: {
    name: 'AI Toolstack',
    email: 'hello@aitoolstack.com'
  },
  social: {
    twitter: '@aitoolstack',
    github: 'https://github.com/aitoolstack'
  }
};

export type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  features: string[];
  pricing: PricingModel;
  rating: number;
  reviews: number;
  websiteUrl: string;
  logoUrl?: string;
};

export const categories = [
  { name: 'Productivity', icon: '⚡', toolCount: 24 },
  { name: 'Developer Tools', icon: '💻', toolCount: 19 },
  { name: 'Design', icon: '🎨', toolCount: 15 },
  { name: 'Marketing', icon: '📈', toolCount: 22 },
  { name: 'Writing', icon: '✍️', toolCount: 31 },
  { name: 'Video', icon: '🎬', toolCount: 12 }
];

export const stats = [
  { label: 'Total Tools', value: '500+' },
  { label: 'Active Users', value: '10K+' },
  { label: 'Reviews', value: '1,000+' },
  { label: 'Blog Posts', value: '100+' }
];

export const tools: Tool[] = [
  {
    id: '1',
    name: 'PromptPilot',
    slug: 'promptpilot',
    description: 'Prompt testing and optimization workspace for AI teams.',
    longDescription:
      'PromptPilot helps product and AI teams evaluate prompt quality with versioning, side-by-side outputs, and performance benchmarks.',
    category: 'Productivity',
    features: ['Prompt testing', 'Version history', 'Team workspaces'],
    pricing: 'FREEMIUM',
    rating: 4.7,
    reviews: 231,
    websiteUrl: 'https://example.com/promptpilot'
  },
  {
    id: '2',
    name: 'VisionForge',
    slug: 'visionforge',
    description: 'Generate and edit visual assets with multimodal workflows.',
    longDescription:
      'VisionForge combines text-to-image, smart inpainting, and brand-safe templates for design and social teams.',
    category: 'Design',
    features: ['Image generation', 'Brand kits', 'Inpainting'],
    pricing: 'PAID',
    rating: 4.5,
    reviews: 158,
    websiteUrl: 'https://example.com/visionforge'
  },
  {
    id: '3',
    name: 'CodeSage AI',
    slug: 'codesage-ai',
    description: 'AI coding assistant with repo-level context and review mode.',
    longDescription:
      'CodeSage AI indexes codebases to provide contextual completions, architecture suggestions, and pull request review insights.',
    category: 'Developer Tools',
    features: ['Repo context', 'Code review', 'Refactor suggestions'],
    pricing: 'FREE',
    rating: 4.3,
    reviews: 403,
    websiteUrl: 'https://example.com/codesage'
  },
  {
    id: '4',
    name: 'AdCraft AI',
    slug: 'adcraft-ai',
    description: 'Generate ad copy variants and campaign ideas in seconds.',
    longDescription:
      'AdCraft AI helps growth teams rapidly iterate paid ads with channel-specific templates and intent-focused messaging.',
    category: 'Marketing',
    features: ['Ad copy', 'Channel templates', 'A/B variants'],
    pricing: 'FREEMIUM',
    rating: 4.4,
    reviews: 189,
    websiteUrl: 'https://example.com/adcraft'
  },
  {
    id: '5',
    name: 'DraftFlow',
    slug: 'draftflow',
    description: 'Long-form writing assistant for content teams and creators.',
    longDescription:
      'DraftFlow supports outlining, tone transformation, and collaborative drafting for newsletters, SEO pages, and blogs.',
    category: 'Writing',
    features: ['Outlines', 'Tone controls', 'Collaboration'],
    pricing: 'PAID',
    rating: 4.6,
    reviews: 277,
    websiteUrl: 'https://example.com/draftflow'
  }
];

export const blogPosts = [
  {
    slug: 'how-to-choose-ai-tools',
    title: 'How to Choose the Right AI Tool for Your Team',
    excerpt: 'A practical framework to evaluate AI tools before you adopt them.',
    readTime: '7 min read',
    date: '2026-02-01',
    category: 'Guides'
  },
  {
    slug: 'best-ai-tools-for-startups',
    title: '10 Best AI Tools for Startups in 2026',
    excerpt: 'A curated shortlist of tools to boost output and reduce costs.',
    readTime: '9 min read',
    date: '2026-01-12',
    category: 'Comparisons'
  }
];

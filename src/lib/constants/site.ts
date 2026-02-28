export const siteConfig = {
  name: 'AI Toolstack',
  description:
    'Discover, review, compare, and learn about the best AI tools in one modern platform.',
  url: 'http://localhost:3000'
};

export type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: 'Free' | 'Paid' | 'Freemium';
  rating: number;
};

export const tools: Tool[] = [
  {
    id: '1',
    name: 'PromptPilot',
    slug: 'promptpilot',
    description: 'Prompt testing and optimization workspace for AI teams.',
    category: 'Productivity',
    pricing: 'Freemium',
    rating: 4.7
  },
  {
    id: '2',
    name: 'VisionForge',
    slug: 'visionforge',
    description: 'Generate and edit visual assets with multimodal workflows.',
    category: 'Design',
    pricing: 'Paid',
    rating: 4.5
  },
  {
    id: '3',
    name: 'CodeSage AI',
    slug: 'codesage-ai',
    description: 'AI coding assistant with repo-level context and review mode.',
    category: 'Developer Tools',
    pricing: 'Free',
    rating: 4.3
  }
];

export const blogPosts = [
  {
    slug: 'how-to-choose-ai-tools',
    title: 'How to Choose the Right AI Tool for Your Team',
    excerpt: 'A practical framework to evaluate AI tools before you adopt them.',
    readTime: '7 min read',
    date: '2026-02-01'
  },
  {
    slug: 'best-ai-tools-for-startups',
    title: '10 Best AI Tools for Startups in 2026',
    excerpt: 'A curated shortlist of tools to boost output and reduce costs.',
    readTime: '9 min read',
    date: '2026-01-12'
  }
];

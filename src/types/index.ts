export type PricingModel = 'FREE' | 'PAID' | 'FREEMIUM';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  toolCount: number;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  logoUrl: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  pricingModel: PricingModel;
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  views: number;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  helpfulCount: number;
  userId: string;
  user?: User;
  toolId: string;
  tool?: Tool;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  readTime: number | null;
  published: boolean;
  publishedAt: Date | null;
  authorId: string;
  author?: User;
  categories?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  toolId: string;
  tool?: Tool;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

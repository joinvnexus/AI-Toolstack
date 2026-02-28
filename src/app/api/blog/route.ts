import { NextResponse } from 'next/server';
import { blogPosts } from '@/lib/constants/site';

export async function GET() {
  return NextResponse.json({ data: blogPosts, total: blogPosts.length });
}

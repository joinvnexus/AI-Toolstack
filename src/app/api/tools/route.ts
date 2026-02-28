import { NextResponse } from 'next/server';
import { tools } from '@/lib/constants/site';

export async function GET() {
  return NextResponse.json({ data: tools, total: tools.length });
}

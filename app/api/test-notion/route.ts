/** @format */

import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/notion';

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

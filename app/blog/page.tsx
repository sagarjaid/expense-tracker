/** @format */

import { Metadata } from 'next';
import { getBlogPosts } from '@/lib/notion';
import BlogList from '@/components/BlogList';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog | ex.sagarjaid',
  description: 'Latest insights and analysis about Bitcoin and other assets',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <Header />
      <main className='min-h-screen bg-background'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <h1 className='text-4xl font-medium text-foreground mb-8'>Blog</h1>
          <BlogList posts={posts} />
        </div>
      </main>
      <Footer />
    </>
  );
}

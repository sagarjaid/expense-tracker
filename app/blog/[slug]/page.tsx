/** @format */

import { Metadata } from 'next';
import { getBlogPostBySlug, getBlogPosts, getNotionBlocks } from '@/lib/notion';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import BlogTOC from '@/components/BlogTOC';
import icon from '@/app/icon.png';
import ShareButtons from '@/components/ShareButtons';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found | ex.sagarjaid',
    };
  }

  return {
    title: `${post.title} | ex.sagarjaid Blog`,
    description: post.slug,
    openGraph: {
      title: post.title,
      description: post.slug,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

function renderNotionBlock(block: any) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          key={block.id}
          className='mb-4'>
          {block.paragraph.rich_text.map((text: any, i: number) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </p>
      );
    case 'heading_1':
      return (
        <h1
          id={block.id}
          key={block.id}
          className='text-3xl font-medium mt-8 mb-4'>
          {block.heading_1.rich_text.map((text: any, i: number) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h1>
      );
    case 'heading_2':
      return (
        <h2
          id={block.id}
          key={block.id}
          className='text-2xl font-medium mt-6 mb-3'>
          {block.heading_2.rich_text.map((text: any, i: number) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h2>
      );
    case 'heading_3':
      return (
        <h3
          id={block.id}
          key={block.id}
          className='text-xl font-medium mt-4 mb-2'>
          {block.heading_3.rich_text.map((text: any, i: number) => (
            <span key={i}>{text.plain_text}</span>
          ))}
        </h3>
      );
    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();
  const blocks = await getNotionBlocks(post.id);

  // Generate ToC from headings
  const toc = blocks
    .filter(
      (block: any) =>
        block.type === 'heading_1' ||
        block.type === 'heading_2' ||
        block.type === 'heading_3'
    )
    .map((block: any) => ({
      id: block.id,
      text: block[block.type].rich_text.map((t: any) => t.plain_text).join(' '),
      type: block.type,
    }));

  return (
    <>
      <Header />
      <div className='bg-background min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Breadcrumbs */}
          <nav className='text-sm mb-6 text-muted-foreground'>
            <Link href='/'>Home</Link> / <Link href='/blog'>Blog</Link> /{' '}
            <span className='text-foreground'>{post.title || 'Hello'}</span>
          </nav>

          <h1 className='text-4xl md:text-6xl font-medium text-foreground mb-6'>
            {post.title}
          </h1>
          {post.subTitle && (
            <div className='text-lg text-muted-foreground mb-12'>
              {post.subTitle}
            </div>
          )}

          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Sidebar */}
            <aside className='lg:w-1/5 w-full flex flex-col gap-8 order-2 lg:order-1'>
              {/* Author Card */}
              <div className='bg-card hidden md:flex border border-border rounded-lg p-4 py-8  flex-col gap-2'>
                {/* {post.author?.[0] || 'A'} */}
                <Image
                  src={icon}
                  alt='icon'
                  width={80}
                  height={80}
                />

                <div className='font-semibold text-lg'>{post.author}</div>
                <div className='text-xs text-muted-foreground'>Author</div>
              </div>
              {/* Table of Contents */}

              <BlogTOC
                toc={toc}
                className='hidden md:block'
                fixed={true}
              />
            </aside>

            {/* Main Content */}
            <article className='flex-1 order-1 lg:order-2'>
              {post.coverImage && (
                <div className='w-full mb-8 border border-border rounded-lg overflow-hidden'>
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={1000}
                    height={563}
                    className='object-cover w-full h-auto'
                    priority
                    sizes='(max-width: 768px) 100vw, 700px'
                  />
                </div>
              )}

              <BlogTOC
                toc={toc}
                className='block md:hidden border border-border rounded-lg p-4'
                fixed={false}
              />

              {/* Main Notion Content */}
              <div className='prose prose-lg dark:prose-invert max-w-3xl text-justify'>
                {blocks.map(renderNotionBlock)}
              </div>

              <div className='flex flex-wrap gap-2 mb-8'>
                {post.tags?.map((tag) => (
                  <span
                    key={tag}
                    className='bg-muted px-2 py-1 rounded text-xs font-medium'>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Share Buttons */}
              <ShareButtons
                title={post.title}
                url={`https://ex.sagarjaid.com/blog/${post.slug}`}
              />
              {/* Written By Section */}
              <div className='flex items-center gap-4 mt-12 mb-8'>
                <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium'>
                  {post.author?.[0] || 'A'}
                </div>
                <div>
                  <div className='font-semibold'>Written by</div>
                  <div>{post.author}</div>
                </div>
              </div>
              {/* CTA Section */}
              <div className='  border border-green-600 rounded-lg p-6 h-64 flex flex-col justify-center items-center text-center mt-8'>
                <h3 className='text-2xl font-medium mb-2 max-w-xl mx-auto text-muted-foreground text-center'>
                  What&apos;s the price of BTC against Stock?
                </h3>
                <p className='mb-4 max-w-xl mx-auto text-muted-foreground text-center'>
                  Compare Asset Prices with Bitcoin&apos;s Value Today, Compare
                  any asset values directly against Bitcoin&apos;s current
                  market price.
                </p>

                <Link
                  href={`/stock`}
                  className='border border-green-600 bg-green-600 hover:bg-green-700 text-white rounded-sm  gap-1.5 font-medium py-4 px-6  flex items-center h-12 transition-colors'>
                  <span>Check BTC price against Stocks</span>
                  <span>🚀</span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const dynamic = 'force-dynamic';

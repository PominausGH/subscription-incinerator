import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPost, CATEGORY_LABELS } from '@/lib/blog'
import { BlogCTA } from '@/components/blog/blog-cta'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <article className="max-w-2xl mx-auto px-4 py-16">
      <header className="mb-12">
        <span className="text-fire-500 text-sm font-medium">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </span>
        <h1 className="text-4xl font-bold text-white mt-2 mb-4">{post.title}</h1>
        <p className="text-gray-400">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div
        className="prose prose-invert max-w-none space-y-6 text-gray-300 leading-relaxed
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:pt-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
          [&_strong]:text-white
          [&_code]:bg-dark-700 [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-fire-400 [&_code]:text-sm
          [&_a]:text-fire-400 [&_a]:hover:underline"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <BlogCTA />
    </article>
  )
}

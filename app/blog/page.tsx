import type { Metadata } from 'next'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips, guides, and insights on managing and cancelling subscriptions.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — Subscription Incinerator',
    description: 'Tips, guides, and insights on managing and cancelling subscriptions.',
    url: '/blog',
  },
}

export default function BlogPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <header className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Blog</h1>
        <p className="text-gray-400 text-lg">
          Tips, guides, and insights on managing and cancelling subscriptions.
        </p>
      </header>

      <div className="grid gap-6">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block bg-dark-800 border border-dark-600 hover:border-fire-500/40 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-fire-500 text-xs font-semibold uppercase tracking-wide">
                {post.category}
              </span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{post.readTime}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">{post.date}</span>
            </div>
            <h2 className="text-white font-bold text-xl mb-2 group-hover:text-fire-400 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">{post.description}</p>
            <p className="mt-4 text-fire-500 text-sm font-medium">Read →</p>
          </Link>
        ))}
      </div>
    </main>
  )
}

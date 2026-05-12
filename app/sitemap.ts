import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog/posts'
import { cancellationServices } from '@/lib/cancel/services'

const BASE_URL = 'https://subscriptionincinerator.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split('T')[0]

  const corePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,               lastModified: today, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE_URL}/pricing`,         lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`,           lastModified: today, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/free-checklist`,  lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources`,       lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/blog`,            lastModified: today, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/cancel`,          lastModified: today, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/open-source`,     lastModified: today, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/login`,           lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`,         lastModified: today, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/privacy`,         lastModified: today, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/terms`,           lastModified: today, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.9,
  }))

  const cancelPages: MetadataRoute.Sitemap = cancellationServices.map((service) => ({
    url: `${BASE_URL}/cancel/${service.slug}`,
    lastModified: today,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...corePages, ...blogPages, ...cancelPages]
}

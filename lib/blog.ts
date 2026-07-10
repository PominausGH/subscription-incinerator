import fs from 'fs'
import path from 'path'

export type BlogPost = {
  slug: string
  title: string
  date: string
  excerpt: string
  category: string
  content: string
}

export const CATEGORY_LABELS: Record<string, string> = {
  'guides': 'Guides',
  'money-tips': 'Money Tips',
  'case-study': 'Case Study',
  'comparison': 'Comparison',
}

const POSTS_FILE =
  process.env.BLOG_POSTS_FILE || path.join(process.cwd(), 'data', 'blog-posts.json')

function loadPosts(): BlogPost[] {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8')) as BlogPost[]
  } catch {
    return []
  }
}

export function getPosts(): BlogPost[] {
  return loadPosts()
}

export function getPost(slug: string): BlogPost | undefined {
  return loadPosts().find((p) => p.slug === slug)
}

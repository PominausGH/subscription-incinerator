import { getPost, getPosts } from '../blog'

export interface SocialThread {
  platform: 'X' | 'LinkedIn' | 'Threads'
  posts: string[]
}

/**
 * Content Repurposer: Turns long-form blog posts into high-engagement social threads.
 * Uses the structure of your blog to create value-first social content.
 */
export class ContentRepurposer {
  /**
   * Generates a social thread based on a blog post slug.
   */
  public static generateThread(slug: string): SocialThread[] {
    const post = getPost(slug)
    if (!post) return []

    const homepage = 'https://subscriptionincinerator.app/'
    const postUrl = `${homepage}blog/${post.slug}`

    return [
      {
        platform: 'X',
        posts: [
          `🧵 ${post.title}\n\nMost people pay a "Subscription Tax" of $200+/year without knowing it. Here's the breakdown of how to stop the bleed. 👇`,
          `1/ The Problem: ${post.excerpt}\n\nWe've audited thousands of bank statements. The patterns are always the same.`,
          `2/ The Strategy: Don't just "check your bank." You need a system. \n\nI broke down the exact 10-minute checklist we use here:`,
          `3/ The Hook: Most trials are designed to trap you. They want your card on file before you've even used the product.\n\nSet a reminder for 2 days BEFORE the trial ends. Not the day of.`,
          `4/ The Solution: Stop doing this manually. \n\nWe built an "Incinerator" to find these for you automatically. \n\nCheck out the full guide here: ${postUrl}`,
          `Want more tips on digital minimalism and saving money? \n\nFollow @SubIncinerator and join the community at ${homepage} 🐨🔥`
        ],
      },
      {
        platform: 'LinkedIn',
        posts: [
          `🚀 **New Guide: ${post.title}**\n\n${post.excerpt}\n\nIn 2026, subscription management isn't just a "nice to have"—it's a critical part of personal and business finance. \n\nWe've seen teams lose thousands to "zombie" seats and forgotten trials. Our latest audit found that the average user saves over $200/year just by running a 10-minute check.\n\nI’ve documented our full methodology in this new post: ${postUrl}\n\n#FinTech #Savings #SubscriptionEconomy #Minimalism`
        ]
      }
    ]
  }

  /**
   * Helper to list all available posts for repurposing.
   */
  public static listAvailablePosts() {
    return getPosts().map(p => ({ slug: p.slug, title: p.title }))
  }
}

import { PrismaClient } from '@prisma/client'
import { cancellationServices } from '@/lib/cancel/services'

const prisma = new PrismaClient()

export interface MissingServiceReport {
  serviceName: string
  count: number
  isHighPriority: boolean
}

/**
 * Directory Bot: Automatically identifies services your users are using
 * that don't yet have a cancellation guide in your directory.
 */
export class DirectoryBot {
  /**
   * Scans the database for the most common services missing from the directory.
   */
  public static async getMissingServicesReport(minThreshold = 5): Promise<MissingServiceReport[]> {
    // 1. Get all unique service names from Subscriptions and PendingSubscriptions
    const subscriptions = await prisma.subscription.groupBy({
      by: ['serviceName'],
      _count: {
        serviceName: true,
      },
    })

    const pending = await prisma.pendingSubscription.groupBy({
      by: ['serviceName'],
      _count: {
        serviceName: true,
      },
    })

    // 2. Combine and count
    const serviceCounts: Record<string, number> = {}

    const processResults = (results: any[]) => {
      results.forEach((r) => {
        const name = r.serviceName.toLowerCase().trim()
        serviceCounts[name] = (serviceCounts[name] || 0) + r._count.serviceName
      })
    }

    processResults(subscriptions)
    processResults(pending)

    // 3. Filter out services already in the directory
    const existingSlugs = new Set(cancellationServices.map((s) => s.slug.toLowerCase()))
    const existingNames = new Set(cancellationServices.map((s) => s.name.toLowerCase()))

    const missing = Object.entries(serviceCounts)
      .filter(([name, count]) => {
        return !existingSlugs.has(name) && !existingNames.has(name) && count >= minThreshold
      })
      .map(([name, count]) => ({
        serviceName: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        isHighPriority: count >= minThreshold * 3, // Arbitrary "High Priority" if 3x the threshold
      }))
      .sort((a, b) => b.count - a.count)

    return missing
  }

  /**
   * Generates a weekly "Content Opportunity" summary for the marketing team.
   */
  public static async generateWeeklyAlert(): Promise<string | null> {
    const missing = await this.getMissingServicesReport()

    if (missing.length === 0) return null

    let report = `🤖 **Directory Bot: Weekly SEO Report**\n\n`
    report += `I've found ${missing.length} services used by our members that are missing from our Cancellation Directory.\n\n`
    
    report += `**Top Opportunities (High Priority):**\n`
    missing.filter(m => m.isHighPriority).forEach(m => {
      report += `- **${m.serviceName}**: Found ${m.count} times. (Link intent is high!)\n`
    })

    report += `\n**Others to watch:**\n`
    missing.filter(m => !m.isHighPriority).slice(0, 5).forEach(m => {
      report += `- ${m.serviceName}: Found ${m.count} times.\n`
    })

    report += `\n🎯 **Action:** Creating guides for these will capture new organic traffic for "How to cancel ${missing[0].serviceName}".`

    return report
  }
}

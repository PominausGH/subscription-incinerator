import { cancellationServices, CancellationService } from '../cancel/services'

export interface SocialReply {
  platform: 'Reddit' | 'Quora' | 'X' | 'LinkedIn'
  text: string
}

/**
 * Social Assistant: Generates value-first, non-spammy replies for community engagement.
 * Helps turn "How do I cancel X?" questions into relationships and traffic.
 */
export class SocialAssistant {
  /**
   * Generates a helpful reply for a specific service.
   */
  public static generateHelpfulReply(serviceSlug: string): SocialReply[] {
    const service = cancellationServices.find((s) => s.slug === serviceSlug)
    if (!service) return []

    const homepage = 'https://subscriptionincinerator.app/'
    const guideUrl = `${homepage}cancel/${service.slug}`

    return [
      {
        platform: 'Reddit',
        text: `Hey! I just cancelled ${service.name} recently. Here is the quickest way to do it:
        
${service.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

I actually found this in a free directory I use to track all my subs so I don't forget them again. Full step-by-step guide with screenshots is here if you need it: ${guideUrl}`,
      },
      {
        platform: 'X',
        text: `Stop the bleed! 🛑 To cancel ${service.name}: 
${service.steps.slice(0, 3).map((step, i) => `${i + 1}️⃣ ${step}`).join('\n')}
...and 3 more steps. Full guide (and how to track it so you don't forget again) here: ${guideUrl} #SubscriptionIncinerator`,
      },
      {
        platform: 'LinkedIn',
        text: `Is your team overpaying for ${service.name}? 📉
        
Many businesses forget to audit their ${service.name} seats, leading to thousands in "zombie" costs. If you're looking to cut the waste, here is the exact cancellation flow:

${service.steps.map((step) => `✅ ${step}`).join('\n')}

I'm building a tool to automate this entire audit process. Check out the Subscription Incinerator if you want to stop the subscription tax: ${homepage}`,
      },
    ]
  }

  /**
   * Generates "Listening Keywords" for a service to use in tools like F5Bot.
   */
  public static getListeningKeywords(service: CancellationService): string[] {
    return [
      `cancel ${service.name}`,
      `stop ${service.name} subscription`,
      `how to delete ${service.name} account`,
      `${service.name} overcharged me`,
      `${service.name} refund`,
    ]
  }
}

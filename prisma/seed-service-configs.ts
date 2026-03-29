import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const configs = [
  {
    serviceName: 'Netflix',
    cancellationUrl: 'https://www.netflix.com/cancel',
    cancellationInstructions: {
      steps: [
        'Go to netflix.com and sign in',
        'Click your profile icon (top right)',
        'Select Account',
        'Scroll to Membership & Billing',
        'Click Cancel Membership',
        'Click Finish Cancellation to confirm',
      ],
    },
  },
  {
    serviceName: 'Spotify',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
    cancellationInstructions: {
      steps: [
        'Go to spotify.com/account and sign in',
        'Click Change Plan under Your Plan',
        'Scroll down and click Cancel Premium',
        'Follow the prompts to confirm',
      ],
    },
  },
  {
    serviceName: 'Amazon Prime',
    cancellationUrl: 'https://www.amazon.com/mc/pipeline/memberships',
    cancellationInstructions: {
      steps: [
        'Go to amazon.com and sign in',
        'Go to Account & Lists > Prime Membership',
        'Click Manage Membership',
        'Click End Membership',
        'Choose End on [date] and confirm',
      ],
    },
  },
  {
    serviceName: 'Adobe',
    cancellationUrl: 'https://account.adobe.com/plans',
    cancellationInstructions: {
      steps: [
        'Go to account.adobe.com/plans and sign in',
        'Click Manage Plan next to your subscription',
        'Click Cancel Plan',
        'Select a cancellation reason',
        'Review early termination fees if applicable',
        'Click Continue to Cancel',
      ],
    },
  },
  {
    serviceName: 'Disney+',
    cancellationUrl: 'https://www.disneyplus.com/account',
    cancellationInstructions: {
      steps: [
        'Go to disneyplus.com and sign in',
        'Click your profile icon',
        'Select Account',
        'Click Cancel Subscription',
        'Confirm cancellation',
      ],
    },
  },
  {
    serviceName: 'YouTube Premium',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    cancellationInstructions: {
      steps: [
        'Go to youtube.com/paid_memberships',
        'Click Manage next to YouTube Premium',
        'Click Deactivate',
        'Confirm deactivation',
      ],
    },
  },
]

async function main() {
  for (const config of configs) {
    await prisma.serviceConfig.upsert({
      where: { serviceName: config.serviceName },
      update: config,
      create: config,
    })
  }
  console.log(`Seeded ${configs.length} service configs`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

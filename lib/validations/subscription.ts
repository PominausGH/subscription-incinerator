import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required').max(255),
  status: z.enum(['trial', 'active']).default('active'),
  billingCycle: z.enum(['monthly', 'yearly', 'custom']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default('USD'),
  trialEndsAt: z.string().datetime().optional(),
  nextBillingDate: z.string().datetime().optional(),
  cancellationUrl: z.string().url().optional(),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

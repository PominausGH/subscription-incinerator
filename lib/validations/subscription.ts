import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required').max(255),
  status: z.enum(['trial', 'active']).default('active'),
  billingCycle: z.enum(['weekly', 'fortnightly', 'monthly', 'yearly', 'custom']).optional(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().default('USD'),
  trialEndsAt: z.string().datetime().optional(),
  nextBillingDate: z.string().datetime().optional(),
  cancellationUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

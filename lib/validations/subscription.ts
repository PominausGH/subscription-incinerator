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

export const updateSubscriptionSchema = z.object({
  serviceName: z.string().min(1).max(255).optional(),
  status: z.enum(['trial', 'active', 'cancelled', 'paused']).optional(),
  billingCycle: z.enum(['weekly', 'fortnightly', 'monthly', 'yearly', 'custom']).optional().nullable(),
  amount: z.coerce.number().positive().optional().nullable(),
  currency: z.string().optional(),
  trialEndsAt: z.string().datetime().optional().nullable(),
  nextBillingDate: z.string().datetime().optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().uuid().optional().nullable(),
  type: z.enum(['PERSONAL', 'BUSINESS']).optional(),
})

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

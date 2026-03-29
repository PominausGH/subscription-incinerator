type ServiceConfigInput = {
  cancellationUrl: string | null
  cancellationInstructions: unknown
} | null

type Instructions = { steps?: string[] }

export function getCancellationSteps(config: ServiceConfigInput): string[] {
  if (config?.cancellationInstructions) {
    const instructions = config.cancellationInstructions as Instructions
    if (Array.isArray(instructions.steps) && instructions.steps.length > 0) {
      return instructions.steps
    }
  }
  return [
    "Go to the service's website and log in",
    'Navigate to Account Settings or Billing',
    'Find the subscription or membership section',
    'Click Cancel Subscription and follow the prompts',
    'Check your email for a cancellation confirmation',
  ]
}

export function getCancellationUrl(
  config: ServiceConfigInput,
  subscriptionCancellationUrl: string | null
): string | null {
  return config?.cancellationUrl ?? subscriptionCancellationUrl ?? null
}

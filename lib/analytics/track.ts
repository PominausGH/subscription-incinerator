/**
 * Fire an Umami custom event from client code. No-ops when the tracker is
 * blocked (ad blockers, DNT) or hasn't loaded, so callers never need a guard.
 *
 * Link CTAs use `data-umami-event` attributes instead of this helper.
 */
export function trackEvent(name: string, data?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(name, data)
    }
  } catch {
    // analytics must never break the app
  }
}

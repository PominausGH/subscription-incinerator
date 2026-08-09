/**
 * Exchange rate service using Frankfurter API (free, no API key needed)
 * Rates are cached for 24 hours to avoid excessive API calls
 */

interface ExchangeRates {
  base: string
  date: string
  rates: Record<string, number>
}

interface CachedRates {
  rates: ExchangeRates
  fetchedAt: number
}

// In-memory cache (in production, use Redis)
let cachedRates: CachedRates | null = null
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
]

export function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.symbol || code + ' '
}

/**
 * Fetch latest exchange rates from Frankfurter API
 */
export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  // Check cache first
  if (cachedRates && cachedRates.rates.base === baseCurrency) {
    const age = Date.now() - cachedRates.fetchedAt
    if (age < CACHE_DURATION_MS) {
      return cachedRates.rates
    }
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${baseCurrency}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours in Next.js
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`)
    }

    const data = await response.json()

    const rates: ExchangeRates = {
      base: data.base,
      date: data.date,
      rates: {
        [baseCurrency]: 1, // Base currency rate is always 1
        ...data.rates,
      },
    }

    // Update cache
    cachedRates = {
      rates,
      fetchedAt: Date.now(),
    }

    return rates
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)

    // Return cached rates if available, even if stale
    if (cachedRates) {
      return cachedRates.rates
    }

    // Return fallback rates (1:1 for all currencies)
    return {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: SUPPORTED_CURRENCIES.reduce((acc, curr) => {
        acc[curr.code] = 1
        return acc
      }, {} as Record<string, number>),
    }
  }
}

/**
 * Convert an amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await fetchExchangeRates(toCurrency)

  // Get the rate from the source currency to the target currency
  const fromRate = rates.rates[fromCurrency]

  if (!fromRate) {
    console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1`)
    return amount
  }

  // Convert: amount in fromCurrency / rate = amount in toCurrency
  return amount / fromRate
}

/**
 * Get all rates relative to a base currency
 */
export async function getRatesForCurrency(baseCurrency: string): Promise<Record<string, number>> {
  const rates = await fetchExchangeRates(baseCurrency)
  return rates.rates
}

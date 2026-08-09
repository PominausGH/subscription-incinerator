'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getCurrencySymbol } from '@/lib/currency/exchange-rates'
import { toMonthlyAmount } from '@/lib/analytics/queries'

type Subscription = {
  id: string
  serviceName: string
  status: string
  billingCycle: string | null
  amount: number | null
  currency: string
  type: 'PERSONAL' | 'BUSINESS'
}

interface AnalyticsSummaryData {
  byCategory?: { name: string; monthly: number; yearly: number }[]
}

interface SpendingAnalyticsProps {
  subscriptions: Subscription[]
  homeCurrency: string
  data?: AnalyticsSummaryData
}

type FilterType = 'all' | 'personal' | 'business'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
]

export function SpendingAnalytics({ subscriptions, homeCurrency, data }: SpendingAnalyticsProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [ratesLoading, setRatesLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Fetch exchange rates on mount
  useEffect(() => {
    setMounted(true)
    async function fetchRates() {
      try {
        const response = await fetch(`/api/exchange-rates?base=${homeCurrency}`)
        if (response.ok) {
          const data = await response.json()
          setExchangeRates(data.rates || {})
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates')
      } finally {
        setRatesLoading(false)
      }
    }
    fetchRates()
  }, [homeCurrency])

  // Track dark mode for chart colors
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Convert amount to home currency
  const convertToHomeCurrency = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === homeCurrency) return amount
    const rate = exchangeRates[fromCurrency]
    if (!rate) return amount // Fallback if rate not found
    return amount / rate
  }

  const symbol = getCurrencySymbol(homeCurrency)

  // Filter by type first
  const filteredByType = subscriptions.filter(s => {
    if (filter === 'all') return true
    if (filter === 'personal') return s.type === 'PERSONAL'
    if (filter === 'business') return s.type === 'BUSINESS'
    return true
  })

  // Filter active subscriptions with amounts
  const activeWithAmount = filteredByType.filter(
    s => s.status === 'active' && s.amount && s.amount > 0
  )

  if (activeWithAmount.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white">Spending Overview</h2>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('personal')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'personal'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setFilter('business')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === 'business'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Business
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {filter === 'all'
            ? 'Add prices to your subscriptions to see spending analytics.'
            : `No ${filter} subscriptions with prices found.`}
        </p>
      </div>
    )
  }

  // Calculate monthly cost for each subscription (converted to home currency)
  const monthlyData = activeWithAmount.map(sub => {
    const converted = convertToHomeCurrency(sub.amount || 0, sub.currency)
    const monthlyAmount = toMonthlyAmount(converted, sub.billingCycle)

    return {
      name: sub.serviceName,
      amount: Math.round(monthlyAmount * 100) / 100,
      originalAmount: sub.amount,
      originalCurrency: sub.currency,
      billingCycle: sub.billingCycle || 'monthly',
    }
  }).sort((a, b) => b.amount - a.amount)

  // Calculate totals
  const totalMonthly = monthlyData.reduce((sum, item) => sum + item.amount, 0)
  const totalYearly = totalMonthly * 12

  // Data for pie chart
  const pieData = monthlyData.slice(0, 8) // Top 8 for readability

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold dark:text-white">Spending Overview</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('personal')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'personal'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setFilter('business')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'business'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Business
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Monthly</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{symbol}{totalMonthly.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Yearly</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{symbol}{totalYearly.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{activeWithAmount.length}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Avg/Sub</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {symbol}{(totalMonthly / activeWithAmount.length).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Bar Chart - Monthly Cost by Service */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Monthly Cost by Service</h3>
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ left: 10, right: 10, top: 4, bottom: 60 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: isDark ? '#d1d5db' : '#374151' }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tickFormatter={(value) => `${symbol}${value}`} tick={{ fill: isDark ? '#d1d5db' : '#374151', fontSize: 10 }} width={55} />
                  <Tooltip
                    formatter={(value) => [`${symbol}${Number(value).toFixed(2)}/mo`, 'Cost']}
                    contentStyle={{ fontSize: 11, color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : undefined }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart - Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Spending Distribution</h3>
          <div className="h-64">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    outerRadius={80}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${symbol}${Number(value).toFixed(2)}/mo`} contentStyle={{ fontSize: 11, color: isDark ? '#f9fafb' : '#111827', backgroundColor: isDark ? '#1f2937' : '#ffffff', border: isDark ? '1px solid #374151' : undefined }} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                    formatter={(value) => <span style={{ color: isDark ? '#d1d5db' : '#374151' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900 dark:text-gray-100">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 font-medium text-gray-900 dark:text-gray-100">Service</th>
                <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Cycle</th>
                <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Monthly</th>
                <th className="text-right py-2 font-medium text-gray-900 dark:text-gray-100">Yearly</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((item, index) => (
                <tr key={item.name} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {item.name}
                  </td>
                  <td className="text-right py-2 text-gray-900 dark:text-gray-200">
                    {getCurrencySymbol(item.originalCurrency)}{item.originalAmount?.toFixed(2)}
                    {item.originalCurrency !== homeCurrency && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({item.originalCurrency})</span>
                    )}
                  </td>
                  <td className="text-right py-2 text-gray-900 dark:text-gray-200 capitalize">
                    {item.billingCycle}
                  </td>
                  <td className="text-right py-2 font-medium">
                    {symbol}{item.amount.toFixed(2)}
                  </td>
                  <td className="text-right py-2 font-medium">
                    {symbol}{(item.amount * 12).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50 dark:bg-gray-800">
                <td className="py-2 dark:text-white">Total</td>
                <td className="text-right py-2"></td>
                <td className="text-right py-2"></td>
                <td className="text-right py-2 dark:text-white">{symbol}{totalMonthly.toFixed(2)}</td>
                <td className="text-right py-2 dark:text-white">{symbol}{totalYearly.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {data?.byCategory && data.byCategory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Spending by Category</h3>
          {mounted && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="monthly"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {data.byCategory.map((entry: { name: string }, index: number) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={((value: number | string) => `${symbol}${Number(value).toFixed(2)}/mo`) as any} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

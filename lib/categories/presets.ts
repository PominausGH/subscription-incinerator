export const PRESET_CATEGORIES = [
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Music', icon: '🎵' },
  { name: 'Streaming', icon: '📺' },
  { name: 'Gaming', icon: '🎮' },
  { name: 'Software', icon: '💻' },
  { name: 'Cloud Storage', icon: '☁️' },
  { name: 'Productivity', icon: '📊' },
  { name: 'AI Tools', icon: '🤖' },
  { name: 'News & Media', icon: '📰' },
  { name: 'Education', icon: '📚' },
  { name: 'Fitness', icon: '💪' },
  { name: 'Food & Delivery', icon: '🍔' },
  { name: 'Shopping', icon: '🛒' },
  { name: 'Finance', icon: '💰' },
  { name: 'Insurance', icon: '🛡️' },
  { name: 'Car & Transport', icon: '🚗' },
  { name: 'Home & Utilities', icon: '🏠' },
  { name: 'Phone & Internet', icon: '📱' },
  { name: 'Health', icon: '🏥' },
  { name: 'Other', icon: '📦' },
]

export function getCategoryIcon(name: string): string {
  const category = PRESET_CATEGORIES.find(c => c.name === name)
  return category?.icon || '📦'
}

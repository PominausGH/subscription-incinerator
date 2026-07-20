import Link from 'next/link'

interface BlogCTAProps {
  title?: string
  description?: string
  buttonText?: string
  href?: string
}

export function BlogCTA({
  title = 'Never get caught by a trial again',
  description = 'Subscription Incinerator scans your Gmail and alerts you before trials convert to paid — free.',
  buttonText = 'Start Free →',
  href = '/login',
}: BlogCTAProps) {
  return (
    <div className="mt-12 p-6 bg-dark-700 rounded-xl border border-fire-500/30 text-center">
      <p className="text-white font-semibold mb-2">{title}</p>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <Link
        href={href}
        className="inline-flex px-6 py-3 bg-fire-500 hover:bg-fire-600 text-white font-semibold rounded-lg transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  )
}

import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function CancelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-dark-900 min-h-screen">
      <Navigation />
      <div className="pt-16">{children}</div>
      <Footer />
    </div>
  )
}

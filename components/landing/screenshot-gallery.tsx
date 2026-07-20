'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const screenshots = [
  {
    src: '/screenshots/cancel-directory.png',
    alt: 'Subscription Incinerator cancellation guide directory',
    caption: 'Step-by-step cancellation guides for 40+ common subscriptions.',
  },
  {
    src: '/screenshots/cancel-netflix.png',
    alt: 'Subscription Incinerator Netflix cancellation guide',
    caption: 'No more hunting for the cancel button — we already found it.',
  },
]

export function ScreenshotGallery() {
  return (
    <section className="py-16 bg-dark-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white">See it in action</h2>
          <p className="text-gray-400 mt-2">Real cancellation guides, not just a tracker.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {screenshots.map((shot) => (
            <figure
              key={shot.src}
              className="relative rounded-xl overflow-hidden border border-dark-600 bg-dark-800"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <figcaption className="p-4 text-sm text-gray-400">{shot.caption}</figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

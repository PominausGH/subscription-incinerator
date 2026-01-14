'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'Is it really free?',
    answer: "Yes, completely free. No hidden charges, no premium tier required. We're building our user base and will add optional paid features later - but the core app will always be free.",
  },
  {
    question: 'Is my data safe?',
    answer: "We only request read-only access to your Gmail - we can't send emails or modify anything. Your bank statements are processed locally and we only store the subscription data you approve. We never sell your data.",
  },
  {
    question: 'What if you miss a subscription?',
    answer: "No detection is perfect. You can always add subscriptions manually, and our pending review system lets you approve or dismiss anything we find. You're always in control.",
  },
  {
    question: 'Which email providers do you support?',
    answer: 'Currently Gmail only. Outlook and other providers are on our roadmap.',
  },
  {
    question: 'Can you cancel subscriptions for me?',
    answer: 'Not yet - we provide step-by-step instructions to help you cancel yourself. Automated cancellation is coming in a future update.',
  },
]

function FAQItem({ question, answer, isOpen, onClick }: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b border-dark-600">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-fire-400' : 'text-white'}`}>
          {question}
        </span>
        <span className={`text-2xl transition-transform ${isOpen ? 'rotate-45 text-fire-500' : 'text-gray-400'}`}>
          +
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-dark-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Questions? We've Got Answers
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-dark-700 rounded-xl border border-dark-600 px-6"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

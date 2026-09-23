'use client'

import { useState, Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

function AuthTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  return (
    <>
      <div className="flex border-b border-dark-600 mb-6">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'login'
              ? 'border-fire-500 text-fire-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-fire-500 text-fire-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('register')}
        >
          Create account
        </button>
      </div>
      {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-4xl" aria-hidden="true">🔥</div>
          <h1 className="mt-6 text-3xl font-extrabold text-white">
            Subscription Incinerator
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Never pay for a forgotten trial again
          </p>
        </div>
        <div className="mt-8 bg-dark-800 border border-dark-600 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
            <AuthTabs />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

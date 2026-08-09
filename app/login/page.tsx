'use client'

import { useState, Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

function AuthTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  return (
    <>
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'login'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">🔥</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Subscription Incinerator
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Never pay for a forgotten trial again
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
            <AuthTabs />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

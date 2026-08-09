# Email & Password Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace magic link (Resend) authentication with email/password login and registration.

**Architecture:** Add a `passwordHash` field to the User model. Switch from the Resend provider to the NextAuth Credentials provider. Switch session strategy from `database` to `jwt` (required for Credentials provider). Create a `/api/auth/register` endpoint for new user signup. Update the login form to accept email + password, and add a registration form. bcrypt handles password hashing.

**Tech Stack:** NextAuth v5 Credentials provider, bcryptjs for hashing, Zod for validation, Prisma for DB, JWT session strategy.

---

### Task 1: Install bcryptjs dependency

**Files:**
- Modify: `package.json`

**Step 1: Install bcryptjs and types**

Run: `npm install bcryptjs && npm install -D @types/bcryptjs`

**Step 2: Verify installation**

Run: `node -e "const b = require('bcryptjs'); console.log('bcryptjs OK')"`
Expected: `bcryptjs OK`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs for password hashing"
```

---

### Task 2: Add passwordHash field to User model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add passwordHash to User model**

In `prisma/schema.prisma`, add this field to the User model after the `emailVerified` field:

```prisma
  passwordHash          String?               @map("password_hash")
```

The field is nullable so existing users (created via magic link) don't break, and to keep the Google OAuth path viable in future.

**Step 2: Create migration**

Run: `npx prisma migrate dev --name add_password_hash`
Expected: Migration created and applied successfully.

**Step 3: Verify migration**

Run: `npx prisma migrate status`
Expected: All migrations applied, no pending.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add passwordHash field to User model"
```

---

### Task 3: Create password utility functions

**Files:**
- Create: `lib/password.ts`
- Create: `__tests__/lib/password.test.ts`

**Step 1: Write the failing test**

Create `__tests__/lib/password.test.ts`:

```typescript
/**
 * @jest-environment node
 */

import { hashPassword, verifyPassword } from '@/lib/password'

describe('password utilities', () => {
  it('should hash a password', async () => {
    const hash = await hashPassword('testPassword123!')
    expect(hash).toBeDefined()
    expect(hash).not.toBe('testPassword123!')
    expect(hash.startsWith('$2')).toBe(true)
  })

  it('should verify a correct password', async () => {
    const hash = await hashPassword('testPassword123!')
    const isValid = await verifyPassword('testPassword123!', hash)
    expect(isValid).toBe(true)
  })

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('testPassword123!')
    const isValid = await verifyPassword('wrongPassword', hash)
    expect(isValid).toBe(false)
  })

  it('should produce different hashes for the same password', async () => {
    const hash1 = await hashPassword('testPassword123!')
    const hash2 = await hashPassword('testPassword123!')
    expect(hash1).not.toBe(hash2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/password.test.ts -v`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `lib/password.ts`:

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/password.test.ts -v`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add lib/password.ts __tests__/lib/password.test.ts
git commit -m "feat: add password hashing utility with tests"
```

---

### Task 4: Create registration validation schema

**Files:**
- Modify: `lib/validations/subscription.ts` (or create `lib/validations/auth.ts`)
- Create: `__tests__/lib/validations/auth.test.ts`

**Step 1: Write the failing test**

Create `__tests__/lib/validations/auth.test.ts`:

```typescript
/**
 * @jest-environment node
 */

import { registerSchema, loginSchema } from '@/lib/validations/auth'

describe('registerSchema', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123!',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'SecurePass123!',
    })
    expect(result.success).toBe(false)
  })

  it('should reject short password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty password', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anyPassword',
    })
    expect(result.success).toBe(true)
  })

  it('should reject missing email', () => {
    const result = loginSchema.safeParse({
      password: 'anyPassword',
    })
    expect(result.success).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/validations/auth.test.ts -v`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `lib/validations/auth.ts`:

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/validations/auth.test.ts -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/validations/auth.ts __tests__/lib/validations/auth.test.ts
git commit -m "feat: add auth validation schemas with tests"
```

---

### Task 5: Create registration API endpoint

**Files:**
- Create: `app/api/auth/register/route.ts`
- Create: `__tests__/api/auth/register.test.ts`

**Step 1: Write the failing test**

Create `__tests__/api/auth/register.test.ts`:

```typescript
/**
 * @jest-environment node
 */

import { POST } from '@/app/api/auth/register/route'
import { db } from '@/lib/db/client'
import { hashPassword } from '@/lib/password'

jest.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
}))

const mockDb = db as jest.Mocked<typeof db>

function createRequest(body: any) {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new user', async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockDb.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
    })

    const res = await POST(createRequest({
      email: 'new@example.com',
      password: 'SecurePass123!',
    }))

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.message).toBe('Account created successfully')
  })

  it('should reject duplicate email', async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing',
      email: 'existing@example.com',
    })

    const res = await POST(createRequest({
      email: 'existing@example.com',
      password: 'SecurePass123!',
    }))

    expect(res.status).toBe(409)
  })

  it('should reject invalid input', async () => {
    const res = await POST(createRequest({
      email: 'not-email',
      password: '123',
    }))

    expect(res.status).toBe(400)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx jest __tests__/api/auth/register.test.ts -v`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json(
      { message: 'Account created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/api/auth/register.test.ts -v`
Expected: All 3 tests PASS

**Step 5: Commit**

```bash
git add app/api/auth/register/route.ts __tests__/api/auth/register.test.ts
git commit -m "feat: add user registration API endpoint with tests"
```

---

### Task 6: Switch auth.ts from Resend to Credentials provider

**Files:**
- Modify: `lib/auth.ts`
- Modify: `__tests__/lib/auth.test.ts`

**Step 1: Update the existing auth test**

Replace the content of `__tests__/lib/auth.test.ts`:

```typescript
/**
 * @jest-environment node
 */

jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

jest.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/lib/db/client', () => ({
  db: {},
}))

jest.mock('@/lib/password', () => ({
  verifyPassword: jest.fn(),
}))

import { isPremium } from '@/lib/auth'

describe('isPremium', () => {
  it('should return true for premium users', () => {
    expect(isPremium({ tier: 'premium' })).toBe(true)
  })

  it('should return false for free users', () => {
    expect(isPremium({ tier: 'free' })).toBe(false)
  })

  it('should return false for null tier', () => {
    expect(isPremium({ tier: null })).toBe(false)
  })

  it('should return false for undefined tier', () => {
    expect(isPremium({})).toBe(false)
  })

  it('should return false for null user', () => {
    expect(isPremium(null)).toBe(false)
  })
})
```

**Step 2: Run test to confirm it still passes with old code**

Run: `npx jest __tests__/lib/auth.test.ts -v`
Expected: PASS (mocks still match the old Resend provider)

**Step 3: Update lib/auth.ts**

Replace the entire content of `lib/auth.ts`:

```typescript
import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db/client";
import { verifyPassword } from "./password";
import { loginSchema } from "./validations/auth";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required')
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tier: string;
    } & DefaultSession["user"];
  }

  interface User {
    tier: string;
  }
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
    newUser: "/dashboard",
  },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as any).tier || "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tier = (token.tier as string) || "free";
      }
      return session;
    },
  },
  trustHost: true,
});

export const { handlers, signIn, signOut } = nextAuth;

export const auth = nextAuth.auth;

export function isPremium(user: { tier?: string | null } | null): boolean {
  return user?.tier === 'premium'
}
```

**Key changes:**
- Resend provider → Credentials provider
- Session strategy: `database` → `jwt`
- Added `authorize` function that validates credentials, looks up user, verifies password
- Callbacks now use `jwt` + `session` (JWT-based) instead of `session` only (database-based)
- Removed `verifyRequest` page reference (no longer needed)
- Removed `RESEND_API_KEY` requirement check (Resend is no longer used for auth)

**Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/auth.test.ts -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add lib/auth.ts __tests__/lib/auth.test.ts
git commit -m "feat: switch from magic link to credentials auth provider"
```

---

### Task 7: Update auth-edge.ts to match JWT strategy

**Files:**
- Modify: `lib/auth-edge.ts`

**Step 1: Update auth-edge.ts**

The edge auth already uses JWT strategy, so minimal changes needed. Just remove the `verifyRequest` page:

```typescript
// Edge-compatible auth configuration for middleware
import NextAuth from "next-auth";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required')
}

export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
    newUser: "/dashboard",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as any).tier || "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).tier = token.tier || "free";
      }
      return session;
    },
  },
  trustHost: true,
});
```

**Step 2: Commit**

```bash
git add lib/auth-edge.ts
git commit -m "refactor: remove verifyRequest page from edge auth config"
```

---

### Task 8: Update LoginForm to email/password and add RegisterForm

**Files:**
- Modify: `components/auth/login-form.tsx`
- Create: `components/auth/register-form.tsx`

**Step 1: Rewrite login-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
```

**Step 2: Create register-form.tsx**

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed.')
        setIsLoading(false)
        return
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Registration succeeded but login failed - redirect to login
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm password
        </label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError(null)
          }}
          required
          minLength={8}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}
```

**Step 3: Commit**

```bash
git add components/auth/login-form.tsx components/auth/register-form.tsx
git commit -m "feat: update login form for credentials and add registration form"
```

---

### Task 9: Update login page with register tab

**Files:**
- Modify: `app/login/page.tsx`

**Step 1: Update the login page to include both login and register**

```typescript
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
```

Note: The page is now `'use client'` because it manages tab state. `LoginForm` uses `useSearchParams()` which requires a `<Suspense>` boundary.

**Step 2: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login/register tabs to auth page"
```

---

### Task 10: Remove verify-request page reference and clean up Resend auth dependency

**Files:**
- Check & remove: `app/verify-request/` (if it exists)
- Verify: No remaining references to magic link auth

**Step 1: Search for Resend provider references**

Run: `grep -r "resend" --include="*.ts" --include="*.tsx" -l` (excluding node_modules)

Look for any remaining references to:
- `next-auth/providers/resend`
- `signIn('resend'`
- `magic link`
- `verify-request`

**Step 2: Remove or update any found references**

Any file still referencing the old magic link flow needs to be updated. The `RESEND_API_KEY` env var can remain since Resend is still used for sending email reminders/notifications — it's just no longer used for authentication.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: clean up magic link auth references"
```

---

### Task 11: Update session usage across the app

**Files:**
- Modify: `lib/session.ts` (if needed)
- Verify: All API routes that use `auth()` still work with JWT sessions

**Step 1: Verify session.ts compatibility**

The current `lib/session.ts` calls `auth()` and checks `session?.user`. This pattern works identically with JWT sessions — no changes needed.

**Step 2: Verify API routes**

Check that API routes using `auth()` access `session.user.id` and `session.user.tier` — these are populated by the JWT callback in the updated auth config. No changes needed if they follow this pattern.

Run a quick search:
```bash
grep -rn "session.user" --include="*.ts" --include="*.tsx" app/api/
```

Verify each route accesses `.id` and optionally `.tier` — both are set in the JWT/session callbacks.

**Step 3: Run all existing tests**

Run: `npx jest --verbose`
Expected: All existing tests pass (some mocks may need updating)

**Step 4: Commit (only if changes were needed)**

```bash
git add -A
git commit -m "fix: update session usage for JWT strategy compatibility"
```

---

### Task 12: End-to-end manual verification

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Test registration flow**

1. Navigate to `http://localhost:3000/login`
2. Click "Create account" tab
3. Enter email and password (8+ chars)
4. Verify redirect to `/dashboard`
5. Verify session works (dashboard loads with user data)

**Step 3: Test login flow**

1. Sign out
2. Navigate to `/login`
3. Enter the registered email and password
4. Verify redirect to `/dashboard`

**Step 4: Test error cases**

1. Try registering with an existing email → "An account with this email already exists"
2. Try logging in with wrong password → "Invalid email or password"
3. Try registering with short password → validation error

**Step 5: Test protected routes**

1. Clear cookies / sign out
2. Navigate to `/dashboard` → should redirect to `/login`
3. Navigate to `/settings` → should redirect to `/login`

**Step 6: Run full test suite**

Run: `npx jest --verbose`
Expected: All tests pass

**Step 7: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete email/password auth migration"
```

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add bcryptjs dependency |
| `prisma/schema.prisma` | Modify | Add `passwordHash` field to User |
| `lib/password.ts` | Create | Password hash/verify utilities |
| `lib/validations/auth.ts` | Create | Zod schemas for login/register |
| `app/api/auth/register/route.ts` | Create | Registration API endpoint |
| `lib/auth.ts` | Modify | Resend → Credentials, database → JWT session |
| `lib/auth-edge.ts` | Modify | Remove verifyRequest page |
| `components/auth/login-form.tsx` | Modify | Email + password form |
| `components/auth/register-form.tsx` | Create | Registration form with confirm password |
| `app/login/page.tsx` | Modify | Add login/register tabs |
| `__tests__/lib/password.test.ts` | Create | Password utility tests |
| `__tests__/lib/validations/auth.test.ts` | Create | Validation schema tests |
| `__tests__/api/auth/register.test.ts` | Create | Registration endpoint tests |
| `__tests__/lib/auth.test.ts` | Modify | Update mocks for Credentials provider |

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set up test environment variables
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_testing'
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-jest'
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-resend-key-for-jest'

// Polyfills for Prisma client compatibility with Jest
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


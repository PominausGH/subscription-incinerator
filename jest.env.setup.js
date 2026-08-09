// This file runs before any test files are loaded
// Set up required environment variables for tests

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-jest'
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-resend-key-for-jest'

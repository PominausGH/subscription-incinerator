import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "./db/client";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required')
}

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is required')
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

/**
 * Build the email from address for Resend
 * Uses EMAIL_FROM env var, or constructs from APP_URL/NEXTAUTH_URL
 * Falls back to Resend's default test domain if no valid domain found
 */
function buildEmailFrom(): string {
  // 1. Check if EMAIL_FROM is explicitly set and not the placeholder
  if (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('localhost')) {
    console.log(`[Auth] Using EMAIL_FROM env var: ${process.env.EMAIL_FROM}`);
    return process.env.EMAIL_FROM;
  }

  // 2. Try to extract domain from APP_URL or NEXTAUTH_URL
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    const url = new URL(appUrl);
    // Skip localhost and IP addresses - Resend requires a real domain
    if (url.hostname && url.hostname !== 'localhost' && !url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const fromAddress = `noreply@${url.hostname}`;
      console.log(`[Auth] Constructed from address from APP_URL: ${fromAddress}`);
      return fromAddress;
    }
  } catch (e) {
    console.warn(`[Auth] Failed to parse APP_URL: ${appUrl}`, e);
  }

  // 3. Production safety - log warning and use Resend's test domain
  // Note: This will only work with Resend's test domain (resend.dev) for testing
  console.warn('[Auth] No valid domain found for EMAIL_FROM. Using fallback.');
  console.warn('[Auth] WARNING: Emails may fail. Set EMAIL_FROM to your verified domain.');
  
  // This is a placeholder that will cause Resend to error with a clear message
  return 'noreply@example.com';
}

/**
 * Custom error class for authentication errors with context
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(db) as any, // Type cast needed due to @auth/core version mismatch between packages
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/error",
    newUser: "/dashboard",
  },
  providers: [
    Resend({
      from: buildEmailFrom(),
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.tier = user.tier || "free";
      }
      return session;
    },
  },
  trustHost: true,
  events: {
    // Log sign-in attempts for debugging
    async signIn({ user, account, isNewUser }) {
      console.log(`[Auth] Sign-in event:`, {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString(),
      });
    },
    // Log when magic link email is sent
    async createUser({ user }) {
      console.log(`[Auth] New user created:`, {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    },
  },
  logger: {
    error(code, ...message) {
      // Log detailed error information for email failures
      if (code === 'email-send-failure') {
        console.error(`[Auth] Email send failure:`, {
          code,
          messages: message,
          timestamp: new Date().toISOString(),
          emailFrom: buildEmailFrom(),
          hasResendKey: !!process.env.RESEND_API_KEY,
          resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8),
        });
      } else {
        console.error(`[Auth] Error [${code}]:`, ...message);
      }
    },
    warn(code, ...message) {
      console.warn(`[Auth] Warning [${code}]:`, ...message);
    },
    debug(code, ...message) {
      // Only log debug in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Auth] Debug [${code}]:`, ...message);
      }
    },
  },
});

export const { handlers, signOut } = nextAuth;

// Export auth directly - no bypass in production
export const auth = nextAuth.auth;

/**
 * Enhanced signIn wrapper with better error handling and logging
 * Use this instead of next-auth's signIn for better error feedback
 */
export async function signInWithMagicLink(email: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    console.log(`[Auth] Initiating magic link sign-in for: ${email}`);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn(`[Auth] Invalid email format: ${email}`);
      return {
        success: false,
        error: 'Please enter a valid email address',
        code: 'invalid-email',
      };
    }

    // Import dynamically to avoid issues with server/client boundary
    const { signIn } = await import('next-auth/react');

    const result = await signIn('resend', {
      email,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (result?.error) {
      console.error(`[Auth] Sign-in failed:`, {
        email,
        error: result.error,
        status: result.status,
        ok: result.ok,
      });

      // Map common error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'email-send-failure': 'Failed to send email. Please check your email address and try again.',
        'configuration': 'Server configuration error. Please contact support.',
        'accessdenied': 'Access denied. Please try again.',
        'verification': 'Email verification failed. Please request a new magic link.',
        'default': 'Something went wrong. Please try again later.',
      };

      return {
        success: false,
        error: errorMessages[result.error] || errorMessages.default,
        code: result.error,
      };
    }

    console.log(`[Auth] Magic link sent successfully to: ${email}`);
    return {
      success: true,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Auth] Unexpected error during sign-in:`, {
      email,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check for specific Resend configuration errors
    if (errorMessage.includes('domain') || errorMessage.includes('from')) {
      console.error(`[Auth] Resend domain configuration issue detected. Check EMAIL_FROM and Resend dashboard.`);
      return {
        success: false,
        error: 'Email service configuration error. Please contact support.',
        code: 'email-config-error',
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'unexpected-error',
    };
  }
}

/**
 * Server-side signIn for API routes or server actions
 * Uses the internal NextAuth signIn
 */
export async function serverSignIn(provider: string, options: { 
  email: string; 
  callbackUrl?: string;
}): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    console.log(`[Auth] Server-side signIn for: ${options.email}`);
    
    // For server-side, we use the NextAuth internal signIn
    const result = await nextAuth.signIn(provider, {
      email: options.email,
      callbackUrl: options.callbackUrl || '/dashboard',
      redirect: false,
    });

    if (result?.error) {
      console.error(`[Auth] Server sign-in failed:`, {
        email: options.email,
        error: result.error,
      });
      return {
        success: false,
        error: 'Failed to send magic link. Please try again.',
        code: result.error,
      };
    }

    console.log(`[Auth] Server sign-in successful for: ${options.email}`);
    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Auth] Server sign-in error:`, errorMessage);
    return {
      success: false,
      error: 'An unexpected error occurred.',
      code: 'server-error',
    };
  }
}

export function isPremium(user: { tier?: string | null } | null): boolean {
  return user?.tier === 'premium'
}

// Log configuration on load for debugging
console.log('[Auth] Configuration loaded:', {
  hasResendKey: !!process.env.RESEND_API_KEY,
  resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) + '...',
  emailFrom: buildEmailFrom(),
  appUrl: process.env.APP_URL || process.env.NEXTAUTH_URL || 'not set',
  nodeEnv: process.env.NODE_ENV,
});

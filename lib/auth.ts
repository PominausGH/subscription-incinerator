import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "./db/client";

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

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is required')
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
      from: process.env.EMAIL_FROM || "noreply@example.com",
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
});

export const { handlers, signIn, signOut } = nextAuth;

// Wrap auth with dev bypass
export const auth = async () => {
  // DEV BYPASS: Return mock session for testing
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return {
      user: {
        id: 'b0cb34a4-add7-48d6-b2bf-5792d4c90583',
        email: 'genmailing@gmail.com',
        tier: 'premium',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  return nextAuth.auth();
};

export function isPremium(user: { tier?: string | null } | null): boolean {
  return user?.tier === 'premium'
}

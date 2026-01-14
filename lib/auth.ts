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

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
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

export function isPremium(user: { tier?: string | null } | null): boolean {
  return user?.tier === 'premium'
}

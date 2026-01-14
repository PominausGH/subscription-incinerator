// Edge-compatible auth configuration for middleware
// This doesn't import the database adapter, so it works in edge runtime
import NextAuth from "next-auth";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required')
}

// Edge-compatible auth - no database adapter, JWT sessions only
// This is used by middleware which runs in edge runtime
// No providers here - authentication happens via /api/auth routes using the main auth.ts
export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/error",
    newUser: "/dashboard",
  },
  providers: [], // Empty - middleware only verifies sessions, doesn't handle sign-in
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

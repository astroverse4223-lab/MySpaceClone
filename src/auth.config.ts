import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtected = request.nextUrl.pathname.startsWith("/profile/edit") ||
        request.nextUrl.pathname.startsWith("/settings") ||
        request.nextUrl.pathname.startsWith("/friends") ||
        request.nextUrl.pathname.startsWith("/feed") ||
        request.nextUrl.pathname.startsWith("/messages");
      if (isProtected && !isLoggedIn) {
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

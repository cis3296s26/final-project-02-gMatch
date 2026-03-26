import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            avatar: user.image,
            oauthProvider: account.provider,
            oauthId: account.providerAccountId,
          }),
        });
        if (!res.ok) {
          console.warn("[NextAuth] Backend returned error, but allowing sign-in");
        }
      } catch (err) {
        console.warn("[NextAuth] Backend unreachable, but allowing sign-in:", err.message);
      }
      // Always allow OAuth sign-in — user syncs to DB when backend is available
      return true;
    },
    async session({ session }) {
      if (session?.user?.email) {
        try {
          const res = await fetch(
            `${API_URL}/api/auth/me?email=${encodeURIComponent(session.user.email)}`
          );
          if (res.ok) {
            const dbUser = await res.json();
            session.user.id = dbUser._id;
            session.user.role = dbUser.role;
          }
        } catch (err) {
          console.error("[NextAuth] session callback error:", err);
        }
      }
      return session;
    },
  },
});



import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { encode } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/** Helper: fetch with a timeout (default 3s) so the app never hangs */
function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

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
        const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
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
        console.warn("[NextAuth] Backend unreachable, allowing sign-in:", err.message);
      }
      return true;
    },
    async session({ session, token }) {
      const accessToken = await encode({
        token,
        secret: process.env.NEXTAUTH_SECRET,
        salt: process.env.AUTH_SALT || '',
      });
     
      if (session?.user?.email) {
        try {
          const res = await fetchWithTimeout(
            `${API_URL}/api/auth/me`
            , {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              credentials: "include",
            }
          );
          if (res.ok) {
            const dbUser = await res.json();
            session.user.id = dbUser._id;
            session.user.role = dbUser.role;
            // Sync name from DB so profile edits are reflected in the session
            if (dbUser.name) session.user.name = dbUser.name;
            session.token = accessToken;
          }
        } catch (err) {
          // Timeout or connection error — return session without DB data
        }
      }
      return session;
    },
  },
});
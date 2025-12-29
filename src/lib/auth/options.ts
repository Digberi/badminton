import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";

const CredentialsSchema = z.object({
  idToken: z.string().min(1),
});

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const authOptions: NextAuthOptions = {
  // IMPORTANT for Credentials provider:
  // It works only with JWT sessions (no DB persistence out of the box).  [oai_citation:4‡next-auth.js.org](https://next-auth.js.org/providers/credentials)
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { idToken } = parsed.data;

        const decoded = await verifyFirebaseIdToken(idToken);

        // decoded: { uid, email, name?, picture?, ... }
        const email = decoded.email?.toLowerCase();
        const name =
          (decoded as any).name ??
          decoded.name ??
          (email ? email.split("@")[0] : "User");
        const image = (decoded as any).picture ?? undefined;

        const adminEmails = getAdminEmails();
        const role: "ADMIN" | "USER" =
          email && adminEmails.has(email) ? "ADMIN" : "USER";

        // Any returned object becomes `user` in jwt callback for first sign-in.  [oai_citation:5‡next-auth.js.org](https://next-auth.js.org/providers/credentials)
        return {
          id: decoded.uid,
          firebaseUid: decoded.uid,
          email: email ?? null,
          name,
          image,
          role,
        } as any;
      },
    }),
  ],

  callbacks: {
    // Persist role/uid in JWT (then expose it in session).  [oai_citation:6‡next-auth.js.org](https://next-auth.js.org/configuration/callbacks)
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        token.email = (user as any).email ?? token.email;
        token.name = (user as any).name ?? token.name;
        token.picture = (user as any).image ?? token.picture;

        token.role = (user as any).role ?? "USER";
        token.firebaseUid = (user as any).firebaseUid ?? (user as any).id;
      }
      return token;
    },

    async session({ session, token }) {
      // Only if authenticated cookies exist, session is non-null in getServerSession()  [oai_citation:7‡next-auth.js.org](https://next-auth.js.org/configuration/nextjs?utm_source=chatgpt.com)
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = ((token as any).role ?? "USER") as "ADMIN" | "USER";
        session.user.firebaseUid = (token as any).firebaseUid;
      }
      return session;
    },
  },

  // Recommended: use NEXTAUTH_SECRET env (used by server + proxy/jwt)  [oai_citation:8‡next-auth.js.org](https://next-auth.js.org/configuration/nextjs?utm_source=chatgpt.com)
  secret: process.env.NEXTAUTH_SECRET,
};
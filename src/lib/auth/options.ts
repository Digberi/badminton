// file: src/lib/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { verifyFirebaseIdToken } from "@/lib/firebase/admin";
import {prisma} from "@/server/db/prisma";

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
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const parsed = CredentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const {idToken} = parsed.data;

          const decoded = await verifyFirebaseIdToken(idToken);

          const firebaseUid = decoded.uid;
          const email = decoded.email?.toLowerCase() ?? null;
          const name =
            (decoded as any).name ??
            decoded.name ??
            (email ? email.split("@")[0] : "User");
          const image = (decoded as any).picture ?? undefined;

          if (!email) {
            throw new Error("Email is required but not provided by Firebase.");
          }

          const adminEmails = getAdminEmails();
          const allowlistAdmin = !!email && adminEmails.has(email);

          // 1) Upsert user by firebaseUid
          const updateData: {
            email: string;
            name: string | null;
            image: string | null;
            role?: "ADMIN";
          } = {
            email,
            name: name ?? null,
            image: image ?? null,
          };

          // Only ever promote to ADMIN via allowlist (no auto-demote)
          if (allowlistAdmin) updateData.role = "ADMIN";

          const user = await prisma.user.upsert({
            where: {firebaseUid},
            create: {
              firebaseUid,
              email,
              name,
              image,
              role: allowlistAdmin ? "ADMIN" : "USER",
            },
            update: updateData,
            select: {
              id: true,
              firebaseUid: true,
              email: true,
              name: true,
              image: true,
              role: true,
            },
          });

          // 2) Return object for NextAuth JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            firebaseUid: user.firebaseUid,
          } as any;
        } catch (e) {
          console.log(e)
          throw e;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        token.email = (user as any).email ?? token.email;
        token.name = (user as any).name ?? token.name;
        token.picture = (user as any).image ?? token.picture;

        token.role = (user as any).role ?? "USER";
        token.firebaseUid = (user as any).firebaseUid;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = ((token as any).role ?? "USER") as "ADMIN" | "USER";
        session.user.firebaseUid = (token as any).firebaseUid;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
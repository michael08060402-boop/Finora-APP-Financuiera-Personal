import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  cookies: {
    pkceCodeVerifier: {
      name: "__Secure-authjs.pkce.code_verifier",
      options: { httpOnly: true, sameSite: "none", path: "/", secure: true },
    },
    state: {
      name: "__Secure-authjs.state",
      options: { httpOnly: true, sameSite: "none", path: "/", secure: true },
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        if (!user.isActive) return null;  // suspended account
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        prisma.loginHistory.create({
          data: { email, userId: user.id, success: true, provider: "credentials" },
        }).catch(() => {});
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: user.id },
          select: { id: true, role: true, isActive: true },
        });
        token.id       = user.id;
        token.role     = dbUser?.role     ?? "user";
        token.isActive = dbUser?.isActive ?? true;
      }
      if (account?.provider === "google" && profile?.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: profile.email,
              name:  profile.name ?? null,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              image: (profile as any).picture ?? null,
            },
          });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (!dbUser.image && (profile as any).picture) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data:  { image: (profile as any).picture },
          });
        }
        // Block suspended Google users
        if (!dbUser.isActive) {
          token.isActive = false;
          return token;
        }
        prisma.loginHistory.create({
          data: { email: profile.email, userId: dbUser.id, success: true, provider: "google" },
        }).catch(() => {});
        token.id       = dbUser.id;
        token.role     = dbUser.role;
        token.isActive = dbUser.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role     = token.role     as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).isActive = token.isActive as boolean;
      }
      return session;
    },
  },
});

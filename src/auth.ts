import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { ensureUsername } from "@/lib/username";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata Sandi", type: "password" },
        turnstileToken: { label: "Turnstile Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const turnstileToken = String(credentials.turnstileToken ?? "").trim();
        const captcha = await verifyTurnstileToken(turnstileToken);
        if (!captcha.success) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;
        if (user.banned) return null;

        // Block login until email is verified (accounts created via signup flow).
        if (!user.emailVerified) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          username: user.username,
          titles: user.titles,
          avatarUrl: user.avatarUrl,
          score: user.score,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as {
        id?: string;
        role?: string;
        username?: string | null;
        titles?: string[];
        avatarUrl?: string | null;
        score?: number;
        banned?: boolean;
        sessionId?: string;
      };

      if (user) {
        t.id = user.id;
        t.role = user.role || "user";
      }

      // Give each logged-in browser/session a stable identifier used for
      // "active devices" tracking and per-device sign-out.
      if (!t.sessionId) {
        t.sessionId = randomUUID();
      }

      if (t.id) {
        // Enforce per-device revocation: if this session has been signed out
        // remotely, drop the identity so the user is treated as logged out.
        try {
          if (t.sessionId) {
            const ds = await prisma.deviceSession.findUnique({
              where: { sessionId: t.sessionId },
              select: { revokedAt: true },
            });
            if (ds && ds.revokedAt) {
              t.sessionId = undefined;
              t.id = undefined;
              t.role = undefined;
              return token;
            }
          }

          const dbUser = await prisma.user.findUnique({
            where: { id: t.id },
            select: {
              name: true,
              image: true,
              username: true,
              titles: true,
              avatarUrl: true,
              score: true,
              role: true,
              banned: true,
            },
          });

          if (dbUser && dbUser.banned) {
            t.banned = true;
            return token;
          }

          if (dbUser) {
            const username = await ensureUsername({
              id: t.id,
              name: dbUser.name,
              username: dbUser.username,
            });

            token.name = dbUser.name;
            token.image = dbUser.image;
            t.username = username ?? dbUser.username;
            t.titles = dbUser.titles;
            t.avatarUrl = dbUser.avatarUrl;
            t.score = dbUser.score;
            t.role = dbUser.role;
          }
        } catch (error) {
          console.error("JWT session callback failed", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      const t = token as {
        id?: string;
        role?: string;
        username?: string | null;
        titles?: string[];
        avatarUrl?: string | null;
        score?: number;
        image?: string | null;
        banned?: boolean;
        sessionId?: string;
      };

      if (session.user) {
        session.user.id = t.id as string;
        session.user.name = token.name;
        session.user.image = t.image ?? null;
        session.user.username = t.username;
        session.user.titles = t.titles ?? [];
        session.user.avatarUrl = t.avatarUrl;
        session.user.score = t.score ?? 0;
        session.user.role = t.role as string;
        session.user.banned = !!t.banned;
        session.user.sessionId = t.sessionId ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

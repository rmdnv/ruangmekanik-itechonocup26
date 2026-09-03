import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string | null;
      titles?: string[];
      avatarUrl?: string | null;
      score: number;
      banned?: boolean;
      sessionId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    username?: string | null;
    titles?: string[];
    avatarUrl?: string | null;
    score?: number;
    banned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    username?: string | null;
    titles?: string[];
    avatarUrl?: string | null;
    score?: number;
    sessionId?: string;
  }
}
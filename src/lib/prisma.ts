import { PrismaClient } from "@prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Validate env vars at startup
getServerEnv();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

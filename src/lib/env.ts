import { z } from "zod";

// ─── Database (Laravel-style) ──────────────────────────────────
const dbSchema = z.object({
  DB_HOST: z.string().min(1, { message: "DB_HOST is required" }),
  DB_PORT: z.string().min(1, { message: "DB_PORT is required" }),
  DB_DATABASE: z.string().min(1, { message: "DB_DATABASE is required" }),
  DB_USERNAME: z.string().min(1, { message: "DB_USERNAME is required" }),
  DB_PASSWORD: z.string().min(1, { message: "DB_PASSWORD is required" }),
});

function buildDatabaseUrl(db: z.infer<typeof dbSchema>): string {
  const encoded = encodeURIComponent(db.DB_PASSWORD);
  return `postgresql://${db.DB_USERNAME}:${encoded}@${db.DB_HOST}:${db.DB_PORT}/${db.DB_DATABASE}?schema=public`;
}

// ─── Server env ────────────────────────────────────────────────
const serverSchema = z.object({
  // Database — choose one:
  //   Option A (recommended): DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
  //   Option B: DATABASE_URL directly
  DATABASE_URL: z.string().optional(),

  NEXTAUTH_SECRET: z.string().min(16, { message: "NEXTAUTH_SECRET must be at least 16 characters" }),
  NEXTAUTH_URL: z.string().url({ message: "NEXTAUTH_URL must be a valid URL" }).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),

  AUTH_GOOGLE_ID: z.string().min(1, { message: "AUTH_GOOGLE_ID is required" }),
  AUTH_GOOGLE_SECRET: z.string().min(1, { message: "AUTH_GOOGLE_SECRET is required" }),

  RESEND_API_KEY: z.string().min(1, { message: "RESEND_API_KEY is required" }),
  EMAIL_FROM: z.string().min(1, { message: "EMAIL_FROM is required" }),

  TURNSTILE_SECRET_KEY: z.string().min(1, { message: "TURNSTILE_SECRET_KEY is required" }),

  IPINFO_TOKEN: z.string().optional(),

  NODE_ENV: z.enum(["development", "production", "test"], {
    message: "NODE_ENV must be one of: development | production | test",
  }).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1, { message: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required" }),
});

// ─── Helpers ───────────────────────────────────────────────────
function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

// ─── Exports ───────────────────────────────────────────────────
let _serverEnv: z.infer<typeof serverSchema> | null = null;
let _clientEnv: z.infer<typeof clientSchema> | null = null;

export function getServerEnv(): z.infer<typeof serverSchema> & { DATABASE_URL: string } {
  if (_serverEnv) return _serverEnv as z.infer<typeof serverSchema> & { DATABASE_URL: string };

  const raw = serverSchema.safeParse(process.env);
  if (!raw.success) {
    console.error("\n╔══════════════════════════════════════════╗");
    console.error("║   Invalid server environment variables   ║");
    console.error("╚══════════════════════════════════════════╝\n");
    console.error(formatZodError(raw.error));
    console.error("\nCopy .env.example to .env.local and fill in the values.\n");
    process.exit(1);
  }

  // Resolve DATABASE_URL: prefer explicit DATABASE_URL, else build from DB_* vars
  let databaseUrl = raw.data.DATABASE_URL;
  if (!databaseUrl) {
    const dbResult = dbSchema.safeParse(process.env);
    if (!dbResult.success) {
      console.error("\n╔════════════════════════════════════════════════════╗");
      console.error("║  Database not configured                          ║");
      console.error("║  Set DATABASE_URL or DB_HOST, DB_PORT, DB_*, etc. ║");
      console.error("╚════════════════════════════════════════════════════╝\n");
      console.error(formatZodError(dbResult.error));
      process.exit(1);
    }
    databaseUrl = buildDatabaseUrl(dbResult.data);
  }

  // Inject into process.env so Prisma can read it
  process.env.DATABASE_URL = databaseUrl;

  _serverEnv = { ...raw.data, DATABASE_URL: databaseUrl };
  return _serverEnv as z.infer<typeof serverSchema> & { DATABASE_URL: string };
}

export function getClientEnv(): z.infer<typeof clientSchema> {
  if (_clientEnv) return _clientEnv;

  const result = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });

  if (!result.success) {
    console.error("\n╔═══════════════════════════════════════════╗");
    console.error("║  Invalid client environment variables     ║");
    console.error("╚═══════════════════════════════════════════╝\n");
    console.error(formatZodError(result.error));
    process.exit(1);
  }

  _clientEnv = result.data;
  return _clientEnv;
}

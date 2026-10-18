import { z } from 'zod';

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, 'NEXTAUTH_SECRET must be at least 16 characters')
    .default('dev-fallback-secret-key-do-not-use-in-prod'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  GEMINI_API_KEY: z.string().optional().default(''),
  KV_REST_API_URL: z.string().optional().default(''),
  KV_REST_API_TOKEN: z.string().optional().default(''),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Validates environment variables using Zod.
 * Allows safe fallback values in test/dev mode when mock mode is used.
 */
export function parseEnv(rawEnv: Record<string, string | undefined> = process.env): AppEnv {
  const isTestOrDev =
    rawEnv.NODE_ENV === 'test' ||
    rawEnv.NODE_ENV === 'development' ||
    !rawEnv.GOOGLE_CLIENT_ID;

  const merged = {
    NEXTAUTH_URL: rawEnv.NEXTAUTH_URL,
    NEXTAUTH_SECRET: rawEnv.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID:
      rawEnv.GOOGLE_CLIENT_ID || (isTestOrDev ? 'mock-google-client-id' : undefined),
    GOOGLE_CLIENT_SECRET:
      rawEnv.GOOGLE_CLIENT_SECRET || (isTestOrDev ? 'mock-google-client-secret' : undefined),
    GEMINI_API_KEY: rawEnv.GEMINI_API_KEY,
    KV_REST_API_URL: rawEnv.KV_REST_API_URL,
    KV_REST_API_TOKEN: rawEnv.KV_REST_API_TOKEN,
  };

  return envSchema.parse(merged);
}

export function isLiveOAuthConfigured(rawEnv: Record<string, string | undefined> = process.env): boolean {
  return Boolean(
    rawEnv.GOOGLE_CLIENT_ID &&
      rawEnv.GOOGLE_CLIENT_SECRET &&
      !rawEnv.GOOGLE_CLIENT_ID.startsWith('your-') &&
      !rawEnv.GOOGLE_CLIENT_ID.startsWith('mock-')
  );
}

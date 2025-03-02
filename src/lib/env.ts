// Required environment variables
const requiredEnvVars = [
  'VITE_WEBHOOK_URL',
  'VITE_ENVIRONMENT',
  'VITE_META_PIXEL_ID'
] as const;

export function validateEnv() {
  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]?.trim()
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

// Export typed environment variables
export const env = {
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
  META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID,
} as const;
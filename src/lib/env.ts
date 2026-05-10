// Helper centralizado de variables de entorno con fail-fast.
// En server: lanza si falta una variable requerida cuando se usa el getter.
// En client: solo expone NEXT_PUBLIC_*.

function required(name: string, value: string | undefined): string {
  if (!value || value.startsWith('TODO_')) {
    throw new Error(
      `Falta la variable de entorno ${name}. Definila en apps/web/.env.local antes de continuar.`,
    )
  }
  return value
}

// Públicas (browser + server)
export const PUBLIC_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
}

// Solo server — nunca importar desde un client component
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
  },
  get anthropicApiKey() {
    return required('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY)
  },
  get r2AccountId() {
    return required('R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID)
  },
  get r2AccessKeyId() {
    return required('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID)
  },
  get r2SecretAccessKey() {
    return required('R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY)
  },
  get r2BucketName() {
    return required('R2_BUCKET_NAME', process.env.R2_BUCKET_NAME)
  },
  get r2S3Endpoint() {
    return required('R2_S3_ENDPOINT', process.env.R2_S3_ENDPOINT)
  },
  get workerSecret() {
    return required('QUEDAMOS_WORKER_SECRET', process.env.QUEDAMOS_WORKER_SECRET)
  },
}

import 'dotenv/config'

/** Comma-separated in CLIENT_ORIGIN, or default dev origins (Vite + electron-vite). */
function parseCorsOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN?.trim()
  if (raw) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean)
  }
  return [
    'http://localhost:5173',
    'http://localhost:1212',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:1212',
  ]
}

export const config = {
  PORT: parseInt(process.env.PORT || '3100', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  /** Allowed browser origins for CORS (register/chat from web or Electron dev). */
  ALLOWED_CORS_ORIGINS: parseCorsOrigins(),
  /** First CLIENT_ORIGIN entry, or default — used for OAuth redirects etc. */
  CLIENT_ORIGIN_PRIMARY: process.env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'anthropic',
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
} as const

if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

if (!config.LLM_API_KEY) {
  console.warn('WARNING: LLM_API_KEY not set. AI features will not work.')
}

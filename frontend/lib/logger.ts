const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? "prod"
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL ?? (APP_ENV === "local" || APP_ENV === "stage" ? "debug" : "error")

const ENABLE_DEBUG = LOG_LEVEL === "debug"

export function debugLog(...args: unknown[]) {
  if (!ENABLE_DEBUG) return
  // eslint-disable-next-line no-console
  console.log(...args)
}

export function infoLog(...args: unknown[]) {
  if (!ENABLE_DEBUG) return
  // eslint-disable-next-line no-console
  console.info(...args)
}

export function errorLog(...args: unknown[]) {
  // Keep errors visible in all environments
  // eslint-disable-next-line no-console
  console.error(...args)
}

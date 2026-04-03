/**
 * ChatBridge HTTP + WS bases.
 * In Vite dev, use same-origin `/chatbridge-api` (proxied to :3100) so registration/chat
 * are not blocked by CORS or flaky localhost↔127.0.0.1 behavior.
 */
export function getChatBridgeHttpBase(): string {
  const envUrl = (import.meta.env.VITE_CHATBRIDGE_URL as string | undefined)?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}/chatbridge-api`
  }

  return 'http://localhost:3100'
}

export function getChatBridgeWsUrl(): string {
  const envUrl = (import.meta.env.VITE_CHATBRIDGE_URL as string | undefined)?.trim()
  if (envUrl) {
    const u = envUrl.replace(/\/$/, '')
    return u.replace(/^http/, 'ws') + '/ws'
  }

  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const { protocol, host } = window.location
    const wsProto = protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${host}/chatbridge-api/ws`
  }

  return 'ws://localhost:3100/ws'
}

import { BRIDGE_PROTOCOL_VERSION } from './constants'

export interface BridgeEnvelope {
  protocolVersion: string
  appSessionId: string
  eventId: string
  type: string
  payload: unknown
}

export interface AppInitPayload {
  domainState: unknown
  config?: unknown
}

export interface AppStatePatchPayload {
  domainState: unknown
  stateVersion: number
}

export interface AppUserActionPayload {
  action: string
  data: Record<string, unknown>
}

export interface AppReadyPayload {
  appId: string
}

export interface AppErrorPayload {
  code: string
  message: string
}

export interface AppAckPayload {
  ackedEventId: string
}

export function createEnvelope(
  type: string,
  appSessionId: string,
  payload: unknown,
): BridgeEnvelope {
  return {
    protocolVersion: BRIDGE_PROTOCOL_VERSION,
    appSessionId,
    eventId: crypto.randomUUID(),
    type,
    payload,
  }
}

export function validateEnvelope(data: unknown): BridgeEnvelope | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  if (
    typeof obj.protocolVersion !== 'string' ||
    typeof obj.appSessionId !== 'string' ||
    typeof obj.eventId !== 'string' ||
    typeof obj.type !== 'string'
  ) {
    return null
  }
  return obj as unknown as BridgeEnvelope
}

export function isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true
  return allowedOrigins.includes(origin)
}

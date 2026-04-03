import { BRIDGE_PROTOCOL_VERSION, AppEventTypes } from './bridge-constants'

const params = new URLSearchParams(window.location.search)
const appSessionId = params.get('appSessionId') ?? 'standalone'

interface Envelope {
  protocolVersion: string
  appSessionId: string
  eventId: string
  type: string
  payload: unknown
}

export function sendToHost(type: string, payload: unknown): void {
  const envelope: Envelope = {
    protocolVersion: BRIDGE_PROTOCOL_VERSION,
    appSessionId,
    eventId: crypto.randomUUID(),
    type,
    payload,
  }
  window.parent.postMessage(envelope, '*')
}

export function onHostMessage(callback: (type: string, payload: unknown) => void): () => void {
  const handler = (event: MessageEvent) => {
    const data = event.data
    if (
      data &&
      typeof data === 'object' &&
      'protocolVersion' in data &&
      'appSessionId' in data &&
      'type' in data
    ) {
      if (data.appSessionId !== appSessionId) return
      callback(data.type as string, data.payload)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}

// Send ready on load
sendToHost(AppEventTypes.READY, { appId: 'weather' })

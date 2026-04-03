export interface WsEnvelope {
  type: string
  payload?: unknown
  eventId?: string
  correlationId?: string
  conversationId?: string
  appSessionId?: string
}

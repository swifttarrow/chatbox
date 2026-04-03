export interface BridgeConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface BridgeMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCallId?: string
  toolName?: string
  createdAt: string
}

export type StreamingState = 'idle' | 'waiting' | 'streaming' | 'done'

export type BridgeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface WsEnvelope {
  type: string
  payload?: unknown
  conversationId?: string
  appSessionId?: string
  eventId?: string
}

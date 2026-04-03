import { create } from 'zustand'
import { BridgeClient } from './client'
import { getStoredToken } from './auth'
import type {
  BridgeConversation,
  BridgeMessage,
  BridgeConnectionStatus,
  StreamingState,
  WsEnvelope,
} from './types'
import { getChatBridgeHttpBase, getChatBridgeWsUrl } from './chatbridge-origin'

const DEFAULT_BRIDGE_URL = getChatBridgeWsUrl()
const DEFAULT_API_URL = getChatBridgeHttpBase()

interface AppSessionInfo {
  appId: string
  appSessionId: string
  uiUrl: string
  domainState: unknown
  status: 'active' | 'completed'
}

interface BridgeState {
  // Connection
  connectionStatus: BridgeConnectionStatus
  bridgeUrl: string
  apiUrl: string
  userId: string

  // Conversations
  conversations: BridgeConversation[]
  currentConversationId: string | null

  // Messages
  messages: BridgeMessage[]
  streamingContent: string
  streamingState: StreamingState
  error: string | null

  // App sessions (for M4+)
  activeAppSessions: Map<string, AppSessionInfo>
  visibleAppSessionId: string | null

  // Actions
  connect: () => void
  disconnect: () => void
  sendMessage: (content: string) => void
  loadConversations: () => Promise<void>
  loadConversation: (id: string) => Promise<void>
  restoreAppSessions: (conversationId: string) => Promise<void>
  createConversation: (title?: string) => Promise<string>
  deleteConversation: (id: string) => Promise<void>
  setVisibleApp: (sessionId: string | null) => void
  clearError: () => void
  sendAppUserAction: (message: WsEnvelope) => void
}

const client = new BridgeClient()

function authHeaders(userId: string): Record<string, string> {
  const token = getStoredToken()
  if (token) return { Authorization: `Bearer ${token}` }
  return { 'x-user-id': userId }
}

export const useBridgeStore = create<BridgeState>((set, get) => {
  // Wire up WS message handler
  client.onMessage((message: WsEnvelope) => {
    const payload = message.payload as Record<string, unknown> | undefined

    switch (message.type) {
      case 'chat.assistant_chunk': {
        const delta = payload?.delta as string
        if (delta) {
          set((s) => ({
            streamingContent: s.streamingContent + delta,
            streamingState: 'streaming',
          }))
        }
        break
      }

      case 'chat.assistant_done': {
        const state = get()
        const assistantMsg: BridgeMessage = {
          id: (payload?.messageId as string) || crypto.randomUUID(),
          role: 'assistant',
          content: state.streamingContent,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          messages: [...s.messages, assistantMsg],
          streamingContent: '',
          streamingState: 'idle',
        }))
        break
      }

      case 'chat.error': {
        const errorMsg = (payload?.error as string) || 'Unknown error'
        set({ streamingContent: '', streamingState: 'idle', error: errorMsg })
        break
      }

      case 'app.mount': {
        const mountConvId = payload?.conversationId as string | undefined
        const currentId = get().currentConversationId
        if (mountConvId && currentId && mountConvId !== currentId) {
          break
        }
        const info: AppSessionInfo = {
          appId: payload?.appId as string,
          appSessionId: payload?.appSessionId as string,
          uiUrl: payload?.uiUrl as string,
          domainState: payload?.domainState,
          status: 'active',
        }
        set((s) => {
          const newSessions = new Map(s.activeAppSessions)
          newSessions.set(info.appSessionId, info)
          return {
            activeAppSessions: newSessions,
            visibleAppSessionId: info.appSessionId,
          }
        })
        break
      }

      case 'app.state_patch': {
        const sessionId = message.appSessionId
        if (sessionId) {
          set((s) => {
            const newSessions = new Map(s.activeAppSessions)
            const existing = newSessions.get(sessionId)
            if (existing) {
              newSessions.set(sessionId, { ...existing, domainState: payload })
            }
            return { activeAppSessions: newSessions }
          })
        }
        break
      }
    }
  })

  client.onStatusChange((status) => {
    set({ connectionStatus: status })
  })

  return {
    connectionStatus: 'disconnected',
    bridgeUrl: DEFAULT_BRIDGE_URL,
    apiUrl: DEFAULT_API_URL,
    userId: 'default-user',
    conversations: [],
    currentConversationId: null,
    messages: [],
    streamingContent: '',
    streamingState: 'idle',
    error: null,
    activeAppSessions: new Map(),
    visibleAppSessionId: null,

    connect() {
      const { bridgeUrl, userId } = get()
      client.connect(`${bridgeUrl}?userId=${userId}`)
    },

    disconnect() {
      client.disconnect()
    },

    sendMessage(content: string) {
      const { currentConversationId } = get()
      if (!currentConversationId) return

      const userMsg: BridgeMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }

      set((s) => ({
        messages: [...s.messages, userMsg],
        streamingState: 'waiting',
        streamingContent: '',
        error: null,
      }))

      client.send({
        type: 'chat.user_message',
        conversationId: currentConversationId,
        payload: { content },
      })
    },

    async loadConversations() {
      const { apiUrl, userId } = get()
      const res = await fetch(`${apiUrl}/api/conversations`, {
        headers: authHeaders(userId),
      })
      const data = await res.json()
      set({ conversations: data.conversations || [] })
    },

    async loadConversation(id: string) {
      const { apiUrl, userId } = get()
      const res = await fetch(`${apiUrl}/api/conversations/${id}`, {
        headers: authHeaders(userId),
      })
      const data = await res.json()
      set({
        currentConversationId: id,
        messages: data.messages || [],
        streamingContent: '',
        streamingState: 'idle',
        error: null,
        activeAppSessions: new Map(),
        visibleAppSessionId: null,
      })
      // Restore any active app sessions for this conversation
      await get().restoreAppSessions(id)
    },

    async restoreAppSessions(conversationId: string) {
      const { apiUrl, userId } = get()
      try {
        const res = await fetch(`${apiUrl}/api/conversations/${conversationId}/app-sessions`, {
          headers: authHeaders(userId),
        })
        const data = await res.json()
        const sessions = data.sessions || []
        const newMap = new Map<string, AppSessionInfo>()
        let firstActive: string | null = null

        for (const s of sessions) {
          if (s.status === 'active' || s.status === 'completed') {
            newMap.set(s.id, {
              appId: s.appId,
              appSessionId: s.id,
              uiUrl: s.uiUrl || '',
              domainState: s.domainState,
              status: s.status as 'active' | 'completed',
            })
            if (s.status === 'active' && !firstActive) {
              firstActive = s.id
            }
          }
        }

        set({
          activeAppSessions: newMap,
          visibleAppSessionId: firstActive,
        })
      } catch {
        // Silently fail — app sessions are non-critical on restore
      }
    },

    async createConversation(title?: string) {
      const { apiUrl, userId } = get()
      const res = await fetch(`${apiUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(userId),
        },
        body: JSON.stringify({ title: title || 'New Conversation' }),
      })
      const data = await res.json()
      set((s) => ({
        conversations: [
          { id: data.id, title: data.title, createdAt: data.createdAt, updatedAt: data.createdAt },
          ...s.conversations,
        ],
        currentConversationId: data.id,
        messages: [],
        streamingContent: '',
        streamingState: 'idle',
      }))
      return data.id
    },

    async deleteConversation(id: string) {
      const { apiUrl, userId, currentConversationId } = get()
      await fetch(`${apiUrl}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(userId),
      })
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(currentConversationId === id
          ? { currentConversationId: null, messages: [] }
          : {}),
      }))
    },

    setVisibleApp(sessionId: string | null) {
      set({ visibleAppSessionId: sessionId })
    },

    clearError() {
      set({ error: null })
    },

    sendAppUserAction(message: WsEnvelope) {
      client.send(message)
    },
  }
})

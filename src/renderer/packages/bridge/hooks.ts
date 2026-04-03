import { useBridgeStore } from './store'

export function useBridgeChat() {
  return useBridgeStore((s) => ({
    messages: s.messages,
    streamingContent: s.streamingContent,
    streamingState: s.streamingState,
    connectionStatus: s.connectionStatus,
    error: s.error,
    currentConversationId: s.currentConversationId,
    sendMessage: s.sendMessage,
    clearError: s.clearError,
  }))
}

export function useBridgeConversations() {
  return useBridgeStore((s) => ({
    conversations: s.conversations,
    currentConversationId: s.currentConversationId,
    loadConversations: s.loadConversations,
    loadConversation: s.loadConversation,
    createConversation: s.createConversation,
    deleteConversation: s.deleteConversation,
  }))
}

export function useBridgeConnection() {
  return useBridgeStore((s) => ({
    connectionStatus: s.connectionStatus,
    connect: s.connect,
    disconnect: s.disconnect,
  }))
}

export function useBridgeAppSessions() {
  return useBridgeStore((s) => ({
    activeAppSessions: s.activeAppSessions,
    visibleAppSessionId: s.visibleAppSessionId,
    setVisibleApp: s.setVisibleApp,
  }))
}

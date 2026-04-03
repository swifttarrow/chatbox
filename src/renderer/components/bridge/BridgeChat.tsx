import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, TextInput, ActionIcon, Text, Loader, Stack, ScrollArea } from '@mantine/core'
import { IconSend } from '@tabler/icons-react'
import { useBridgeChat } from '@/packages/bridge/hooks'
import { BridgeMessageItem } from './BridgeMessageItem'

export function BridgeChat() {
  const {
    messages,
    streamingContent,
    streamingState,
    currentConversationId,
    error,
    sendMessage,
    clearError,
  } = useBridgeChat()

  const [input, setInput] = useState('')
  const viewport = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, streamingContent, scrollToBottom])

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || streamingState !== 'idle' || !currentConversationId) return
    sendMessage(trimmed)
    setInput('')
  }, [input, streamingState, currentConversationId, sendMessage])

  if (!currentConversationId) {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Text c="dimmed">Select or create a conversation to start chatting</Text>
      </Box>
    )
  }

  return (
    <Stack style={{ height: '100%' }} gap={0}>
      <ScrollArea style={{ flex: 1 }} viewportRef={viewport} p="md">
        {messages.map((msg) => (
          <BridgeMessageItem key={msg.id} message={msg} />
        ))}
        {streamingState !== 'idle' && (
          <BridgeMessageItem
            message={{
              id: 'streaming',
              role: 'assistant',
              content: '',
              createdAt: new Date().toISOString(),
            }}
            isStreaming
            streamingContent={streamingContent || (streamingState === 'waiting' ? '' : '')}
          />
        )}
        {streamingState === 'waiting' && !streamingContent && (
          <Box ta="center" py="xs">
            <Loader size="xs" type="dots" />
          </Box>
        )}
      </ScrollArea>

      {error && (
        <Box p="xs" bg="red.0" style={{ cursor: 'pointer' }} onClick={clearError}>
          <Text size="xs" c="red">
            {error} (click to dismiss)
          </Text>
        </Box>
      )}

      <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <TextInput
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          disabled={streamingState !== 'idle'}
          rightSection={
            <ActionIcon
              onClick={handleSubmit}
              disabled={!input.trim() || streamingState !== 'idle'}
              variant="filled"
              color="blue"
              size="sm"
            >
              <IconSend size={14} />
            </ActionIcon>
          }
        />
      </Box>
    </Stack>
  )
}

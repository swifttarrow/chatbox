import { Box, Paper, Text, Avatar, Group } from '@mantine/core'
import { IconUser, IconRobot } from '@tabler/icons-react'
import type { BridgeMessage } from '@/packages/bridge/types'
import Markdown from '@/components/Markdown'

interface Props {
  message: BridgeMessage
  isStreaming?: boolean
  streamingContent?: string
}

export function BridgeMessageItem({ message, isStreaming, streamingContent }: Props) {
  const isUser = message.role === 'user'
  const isTool = message.role === 'tool'
  const content = isStreaming && streamingContent !== undefined ? streamingContent : message.content

  return (
    <Box mb="sm">
      <Group gap="xs" align="flex-start" wrap="nowrap">
        <Avatar size="sm" radius="xl" color={isUser ? 'blue' : 'green'} mt={4}>
          {isUser ? <IconUser size={16} /> : <IconRobot size={16} />}
        </Avatar>
        <Paper
          p="sm"
          radius="md"
          style={{
            flex: 1,
            backgroundColor: isUser
              ? 'var(--mantine-color-blue-0)'
              : isTool
                ? 'var(--mantine-color-gray-1)'
                : 'var(--mantine-color-gray-0)',
          }}
        >
          {isTool ? (
            <Text size="xs" c="dimmed">
              Tool: {message.toolName || 'unknown'} — {content}
            </Text>
          ) : (
            <Markdown>{content || ''}</Markdown>
          )}
          {isStreaming && <span className="bridge-cursor">▊</span>}
        </Paper>
      </Group>
    </Box>
  )
}

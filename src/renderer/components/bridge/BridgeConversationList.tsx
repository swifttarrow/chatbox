import { useEffect } from 'react'
import { Box, Button, NavLink, Stack, Text, ActionIcon, Group } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useBridgeConversations } from '@/packages/bridge/hooks'

export function BridgeConversationList() {
  const {
    conversations,
    currentConversationId,
    loadConversations,
    loadConversation,
    createConversation,
    deleteConversation,
  } = useBridgeConversations()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          fullWidth
          size="xs"
          onClick={() => createConversation()}
        >
          New Conversation
        </Button>
      </Box>

      <Box style={{ flex: 1, overflowY: 'auto' }} p="xs">
        {conversations.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="lg">
            No conversations yet
          </Text>
        ) : (
          conversations.map((conv) => (
            <Group key={conv.id} gap={0} wrap="nowrap">
              <NavLink
                label={conv.title}
                description={new Date(conv.createdAt).toLocaleDateString()}
                active={conv.id === currentConversationId}
                onClick={() => loadConversation(conv.id)}
                style={{ flex: 1 }}
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(conv.id)
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))
        )}
      </Box>
    </Stack>
  )
}

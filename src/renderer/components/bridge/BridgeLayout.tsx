import { useEffect } from 'react'
import { Box, Group, Text } from '@mantine/core'
import { useBridgeConnection, useBridgeAppSessions } from '@/packages/bridge/hooks'
import { BridgeConversationList } from './BridgeConversationList'
import { BridgeChat } from './BridgeChat'
import { AppContainer } from './AppContainer'
import { AppTabs } from './AppTabs'
import { ConnectionStatus } from './ConnectionStatus'

function ActiveApp() {
  const { activeAppSessions, visibleAppSessionId } = useBridgeAppSessions()

  if (!visibleAppSessionId) return null

  const session = activeAppSessions.get(visibleAppSessionId)
  if (!session || !session.uiUrl) return null

  return (
    <Box
      style={{
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: 450,
      }}
    >
      <AppContainer
        appSessionId={session.appSessionId}
        appId={session.appId}
        uiUrl={session.uiUrl}
        allowedOrigins={[]}
        initialState={session.domainState}
        status={session.status}
      />
    </Box>
  )
}

export function BridgeLayout() {
  const { connect, disconnect } = useBridgeConnection()

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return (
    <Box style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <Box
        style={{
          width: 260,
          borderRight: '1px solid var(--mantine-color-gray-3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Group
          p="sm"
          justify="space-between"
          style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
        >
          <Text fw={600} size="sm">
            ChatBridge
          </Text>
          <ConnectionStatus />
        </Group>
        <Box style={{ flex: 1 }}>
          <BridgeConversationList />
        </Box>
      </Box>

      {/* Main area */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppTabs />
        <ActiveApp />
        <Box style={{ flex: 1, minHeight: 0 }}>
          <BridgeChat />
        </Box>
      </Box>
    </Box>
  )
}

import { Group, Badge } from '@mantine/core'
import { useBridgeAppSessions } from '@/packages/bridge/hooks'

export function AppTabs() {
  const { activeAppSessions, visibleAppSessionId, setVisibleApp } = useBridgeAppSessions()

  if (activeAppSessions.size === 0) return null

  return (
    <Group gap="xs" p="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
      {[...activeAppSessions.entries()].map(([sessionId, session]) => (
        <Badge
          key={sessionId}
          variant={sessionId === visibleAppSessionId ? 'filled' : 'outline'}
          color={session.status === 'completed' ? 'gray' : 'blue'}
          style={{ cursor: 'pointer' }}
          onClick={() => setVisibleApp(sessionId === visibleAppSessionId ? null : sessionId)}
        >
          {session.appId}
          {session.status === 'completed' && ' (done)'}
        </Badge>
      ))}
    </Group>
  )
}

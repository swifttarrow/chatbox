import { Badge } from '@mantine/core'
import { useBridgeConnection } from '@/packages/bridge/hooks'

export function ConnectionStatus() {
  const { connectionStatus } = useBridgeConnection()

  const color =
    connectionStatus === 'connected'
      ? 'green'
      : connectionStatus === 'reconnecting'
        ? 'yellow'
        : 'red'

  return (
    <Badge color={color} size="xs" variant="dot">
      {connectionStatus}
    </Badge>
  )
}

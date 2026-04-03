import { useState, useEffect } from 'react'
import { Box, Loader, Text, Button, Stack } from '@mantine/core'
import { AppIframe } from './AppIframe'

interface AppContainerProps {
  appSessionId: string
  appId: string
  uiUrl: string
  allowedOrigins: string[]
  initialState: unknown
  status: 'active' | 'completed'
}

export function AppContainer({
  appSessionId,
  appId,
  uiUrl,
  allowedOrigins,
  initialState,
  status,
}: AppContainerProps) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!uiUrl) {
      setLoadState('error')
      return
    }
    const timer = setTimeout(() => {
      if (loadState === 'loading') {
        setLoadState('ready') // Assume ready after timeout
      }
    }, 10000)
    // If we get app.ready message, mark as ready immediately
    setLoadState('ready') // For MVP, assume iframe loads
    return () => clearTimeout(timer)
  }, [uiUrl])

  if (!uiUrl) {
    return (
      <Box p="md" ta="center">
        <Text c="dimmed">No UI available for this app</Text>
      </Box>
    )
  }

  if (loadState === 'error') {
    return (
      <Stack p="md" align="center">
        <Text c="red">Failed to load app</Text>
        <Button size="xs" variant="light" onClick={() => setLoadState('loading')}>
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      {loadState === 'loading' && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.8)',
            zIndex: 1,
          }}
        >
          <Loader size="md" />
        </Box>
      )}
      {status === 'completed' && (
        <Box
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
          }}
        >
          <Text size="xs" c="dimmed" bg="white" p={4} style={{ borderRadius: 4 }}>
            Game Over
          </Text>
        </Box>
      )}
      <AppIframe
        appSessionId={appSessionId}
        appId={appId}
        uiUrl={uiUrl}
        allowedOrigins={allowedOrigins}
        initialState={initialState}
      />
    </Box>
  )
}

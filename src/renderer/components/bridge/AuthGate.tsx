import { useEffect, useState, type ReactNode } from 'react'
import { Box, Loader } from '@mantine/core'
import { AuthForm } from './AuthForm'
import { verifyAuth, getStoredToken } from '@/packages/bridge/auth'
import { useBridgeStore } from '@/packages/bridge/store'

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    async function check() {
      const token = getStoredToken()
      if (!token) {
        setChecking(false)
        return
      }
      const user = await verifyAuth()
      if (user) {
        useBridgeStore.setState({ userId: user.userId })
        setAuthenticated(true)
      }
      setChecking(false)
    }
    check()
  }, [])

  if (checking) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size="lg" />
      </Box>
    )
  }

  if (!authenticated) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <AuthForm
          onSuccess={() => {
            const token = getStoredToken()
            if (token) {
              useBridgeStore.setState({ userId: 'authenticated' })
              setAuthenticated(true)
            }
          }}
        />
      </Box>
    )
  }

  return <>{children}</>
}

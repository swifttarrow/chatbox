import { useState } from 'react'
import { Button, TextInput, PasswordInput, Stack, Title, Text, Paper, SegmentedControl } from '@mantine/core'
import { signIn, signUp } from '@/packages/bridge/auth'

interface AuthFormProps {
  onSuccess: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName)
      } else {
        await signIn(email, password)
      }
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper p="xl" shadow="md" radius="md" style={{ width: 400, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Title order={3} ta="center">
            ChatBridge
          </Title>

          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v as 'signin' | 'signup')}
            data={[
              { label: 'Sign In', value: 'signin' },
              { label: 'Sign Up', value: 'signup' },
            ]}
            fullWidth
          />

          {mode === 'signup' && (
            <TextInput
              label="Display Name"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
              required
            />
          )}

          <TextInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            minLength={8}
          />

          {error && (
            <Text size="sm" c="red">
              {error}
            </Text>
          )}

          <Button type="submit" loading={loading} fullWidth>
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}

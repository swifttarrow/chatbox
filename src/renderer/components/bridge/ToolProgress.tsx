import { Box, Group, Loader, Text } from '@mantine/core'

interface ToolProgressProps {
  toolName?: string
  appName?: string
}

export function ToolProgress({ toolName, appName }: ToolProgressProps) {
  const label = appName
    ? `Using ${appName}...`
    : toolName
      ? `Running ${toolName}...`
      : 'Processing...'

  return (
    <Box py="xs" px="md">
      <Group gap="xs">
        <Loader size="xs" />
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Group>
    </Box>
  )
}

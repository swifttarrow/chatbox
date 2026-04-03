import { createFileRoute } from '@tanstack/react-router'
import { BridgeLayout } from '@/components/bridge/BridgeLayout'
import { AuthGate } from '@/components/bridge/AuthGate'

function BridgePage() {
  return (
    <AuthGate>
      <BridgeLayout />
    </AuthGate>
  )
}

export const Route = createFileRoute('/bridge')({
  component: BridgePage,
})

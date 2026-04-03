import { useCallback, useEffect, useRef } from 'react'
import {
  validateEnvelope,
  createEnvelope,
  isValidOrigin,
} from '@shared/bridge/protocol'
import { AppEventTypes, AppCommandTypes } from '@shared/bridge/constants'
import { useBridgeStore } from '@/packages/bridge/store'

interface AppIframeProps {
  appSessionId: string
  appId: string
  uiUrl: string
  allowedOrigins: string[]
  initialState: unknown
}

export function AppIframe({
  appSessionId,
  appId,
  uiUrl,
  allowedOrigins,
  initialState,
}: AppIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readySent = useRef(false)

  const sendToIframe = useCallback(
    (type: string, payload: unknown) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      const envelope = createEnvelope(type, appSessionId, payload)
      iframe.contentWindow.postMessage(envelope, '*')
    },
    [appSessionId],
  )

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (allowedOrigins.length > 0 && !isValidOrigin(event.origin, allowedOrigins)) {
        return
      }

      const envelope = validateEnvelope(event.data)
      if (!envelope) return
      if (envelope.appSessionId !== appSessionId) return

      if (envelope.type === AppEventTypes.READY) {
        sendToIframe(AppCommandTypes.INIT, { domainState: initialState })
        readySent.current = true
        return
      }

      if (envelope.type === AppEventTypes.USER_ACTION) {
        // Forward to server via WS
        const wsMessage = {
          type: 'app.user_action',
          appSessionId: envelope.appSessionId,
          payload: envelope.payload,
        }
        useBridgeStore.getState().sendAppUserAction(wsMessage)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [appSessionId, allowedOrigins, initialState, sendToIframe])

  // Forward server commands to iframe
  useEffect(() => {
    const unsub = useBridgeStore.subscribe((state, prevState) => {
      const session = state.activeAppSessions.get(appSessionId)
      const prevSession = prevState.activeAppSessions.get(appSessionId)

      if (session && session !== prevSession && session.domainState !== prevSession?.domainState) {
        sendToIframe(AppCommandTypes.STATE_PATCH, {
          domainState: session.domainState,
          stateVersion: 0,
        })
      }
    })
    return unsub
  }, [appSessionId, sendToIframe])

  const src = `${uiUrl}?appSessionId=${encodeURIComponent(appSessionId)}&protocolVersion=1.0`

  return (
    <iframe
      ref={iframeRef}
      src={src}
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        minHeight: 400,
      }}
      title={`App: ${appId}`}
    />
  )
}

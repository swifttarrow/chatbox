import type { BridgeConnectionStatus, WsEnvelope } from './types'

type MessageHandler = (message: WsEnvelope) => void
type StatusHandler = (status: BridgeConnectionStatus) => void

export class BridgeClient {
  private ws: WebSocket | null = null
  private url: string = ''
  private messageHandlers: MessageHandler[] = []
  private statusHandlers: StatusHandler[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private maxReconnectDelay = 30000
  private shouldReconnect = false

  connect(url: string): void {
    this.url = url
    this.shouldReconnect = true
    this.reconnectAttempt = 0
    this.doConnect()
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.notifyStatus('disconnected')
  }

  send(message: WsEnvelope): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler)
    }
  }

  private doConnect(): void {
    this.notifyStatus('connecting')

    try {
      this.ws = new WebSocket(this.url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.reconnectAttempt = 0
      this.notifyStatus('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsEnvelope
        for (const handler of this.messageHandlers) {
          handler(message)
        }
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.ws = null
      if (this.shouldReconnect) {
        this.notifyStatus('reconnecting')
        this.scheduleReconnect()
      } else {
        this.notifyStatus('disconnected')
      }
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay)
    this.reconnectAttempt++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.doConnect()
    }, delay)
  }

  private notifyStatus(status: BridgeConnectionStatus): void {
    for (const handler of this.statusHandlers) {
      handler(status)
    }
  }
}

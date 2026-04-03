import http from 'node:http'
import { URL } from 'node:url'
import { WebSocketServer, WebSocket } from 'ws'
import { connectionManager } from './connection-manager.js'
import type { WsEnvelope } from './types.js'
import { handleChatMessage } from './handlers/chat.js'
import { handleAppUserAction } from './handlers/app-events.js'

const HEARTBEAT_INTERVAL = 30_000
const HEARTBEAT_TIMEOUT = 10_000

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean
  userId: string
}

export function createWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`)

    if (url.pathname !== '/ws') {
      socket.destroy()
      return
    }

    const userId = url.searchParams.get('userId')
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ;(ws as ExtendedWebSocket).userId = userId
      ;(ws as ExtendedWebSocket).isAlive = true
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (rawWs: WebSocket) => {
    const ws = rawWs as ExtendedWebSocket
    const { userId } = ws

    connectionManager.addConnection(userId, ws)
    console.log(`[WS] Connection opened: userId=${userId}`)

    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsEnvelope
        if (!message.type) {
          connectionManager.sendToConnection(ws, {
            type: 'error',
            payload: { error: 'Message must include a "type" field' },
          })
          return
        }

        console.log(`[WS] Message from userId=${userId}: type=${message.type}`)

        if (message.type === 'ping') {
          connectionManager.sendToConnection(ws, { type: 'pong' })
          return
        }

        if (message.type === 'chat.user_message') {
          handleChatMessage(ws, userId, message)
          return
        }

        if (message.type === 'app.user_action') {
          handleAppUserAction(ws, userId, message)
          return
        }
      } catch {
        connectionManager.sendToConnection(ws, {
          type: 'error',
          payload: { error: 'Invalid JSON' },
        })
      }
    })

    ws.on('close', () => {
      connectionManager.removeConnection(userId, ws)
      console.log(`[WS] Connection closed: userId=${userId}`)
    })

    ws.on('error', (err) => {
      console.error(`[WS] Error for userId=${userId}:`, err.message)
      connectionManager.removeConnection(userId, ws)
    })
  })

  // Heartbeat interval
  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      const ws = client as ExtendedWebSocket
      if (!ws.isAlive) {
        console.log(`[WS] Terminating stale connection: userId=${ws.userId}`)
        ws.terminate()
        continue
      }
      ws.isAlive = false
      ws.ping()
    }
  }, HEARTBEAT_INTERVAL)

  wss.on('close', () => {
    clearInterval(heartbeat)
  })

  return wss
}

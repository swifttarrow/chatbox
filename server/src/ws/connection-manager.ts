import type { WebSocket } from 'ws'
import type { WsEnvelope } from './types.js'

class ConnectionManager {
  private connections = new Map<string, Set<WebSocket>>()

  addConnection(userId: string, ws: WebSocket): void {
    let userConnections = this.connections.get(userId)
    if (!userConnections) {
      userConnections = new Set()
      this.connections.set(userId, userConnections)
    }
    userConnections.add(ws)
  }

  removeConnection(userId: string, ws: WebSocket): void {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      userConnections.delete(ws)
      if (userConnections.size === 0) {
        this.connections.delete(userId)
      }
    }
  }

  sendToUser(userId: string, message: WsEnvelope): void {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      const data = JSON.stringify(message)
      for (const ws of userConnections) {
        if (ws.readyState === ws.OPEN) {
          ws.send(data)
        }
      }
    }
  }

  sendToConnection(ws: WebSocket, message: WsEnvelope): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  getConnections(userId: string): Set<WebSocket> | undefined {
    return this.connections.get(userId)
  }
}

export const connectionManager = new ConnectionManager()

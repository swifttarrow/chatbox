import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

export function cspMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const isDev = config.NODE_ENV !== 'production'

  const directives = [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `frame-src 'self' http://localhost:3200 http://localhost:3201 http://localhost:3202`,
    `connect-src 'self' ws://localhost:3100 wss://localhost:3100 http://localhost:3100`,
    "img-src 'self' data:",
  ]

  res.setHeader('Content-Security-Policy', directives.join('; '))
  next()
}

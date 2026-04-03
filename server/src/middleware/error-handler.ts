import type { Request, Response, NextFunction } from 'express'
import { config } from '../config.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Unhandled error:', err.message)
  if (config.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  const statusCode = (err as any).statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
  })
}

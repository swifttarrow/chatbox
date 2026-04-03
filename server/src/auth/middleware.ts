import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from './utils.js'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userEmail?: string
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check for JWT in Authorization header
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const decoded = verifyToken(token)
    if (decoded) {
      req.userId = decoded.userId
      req.userEmail = decoded.email
      next()
      return
    }
  }

  // Fallback: check x-user-id header (dev/testing)
  const devUserId = req.headers['x-user-id'] as string
  if (devUserId) {
    req.userId = devUserId
    next()
    return
  }

  res.status(401).json({ error: 'Authentication required' })
}

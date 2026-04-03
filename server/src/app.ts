import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler } from './middleware/error-handler.js'
import { cspMiddleware } from './middleware/csp.js'
import { authMiddleware } from './auth/middleware.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import conversationsRouter from './routes/conversations.js'
import appsRouter from './routes/apps.js'
import appSessionsRouter from './routes/app-sessions.js'
import oauthRouter from './routes/oauth.js'

const app = express()

app.use(express.json())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.ALLOWED_CORS_ORIGINS.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`))
      }
    },
    credentials: true,
  }),
)
app.use(requestLogger)
app.use(cspMiddleware)

// Public routes
app.use('/health', healthRouter)
app.use('/api/auth', authRouter)

// OAuth routes (authorize is public for redirect, callback is public, status/delete need auth)
app.use('/api/oauth', authMiddleware, oauthRouter)

// Protected routes
app.use('/api/conversations', authMiddleware, conversationsRouter)
app.use('/api/apps', appsRouter) // Apps list is public
app.use('/api', authMiddleware, appSessionsRouter)

// Static files for app iframes (production)
app.use('/apps', express.static('public/apps'))

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(errorHandler)

export default app

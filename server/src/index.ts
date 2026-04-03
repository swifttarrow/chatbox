import { config } from './config.js'
import app from './app.js'
import { createWebSocketServer } from './ws/gateway.js'
import { seedAppDefinitions } from './apps/registry.js'
import { registerAdapter } from './apps/adapter.js'
import { ChessAdapter } from './apps/adapters/chess.js'
import { EquationSolverAdapter } from './apps/adapters/equation-solver.js'
import { WeatherAdapter } from './apps/adapters/weather.js'
import { GitHubAppAdapter } from './apps/adapters/github-app.js'

const server = app.listen(config.PORT, async () => {
  console.log(`ChatBridge server starting on port ${config.PORT}`)
  try {
    registerAdapter(new ChessAdapter())
    registerAdapter(new EquationSolverAdapter())
    registerAdapter(new WeatherAdapter())
    registerAdapter(new GitHubAppAdapter())
    await seedAppDefinitions()
    console.log('App definitions seeded successfully')
  } catch (err) {
    console.error('Failed to seed app definitions:', (err as Error).message)
  }
})

createWebSocketServer(server)

export default server

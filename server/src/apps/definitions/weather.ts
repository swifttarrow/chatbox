import { z } from 'zod'
import type { AppDefinition } from '../types.js'

export const weatherDefinition: AppDefinition = {
  id: 'weather',
  version: '1.0.0',
  appType: 'hybrid_session',
  displayName: 'Weather Dashboard',
  description:
    'Get current weather and forecasts for any location. Shows temperature, conditions, wind, humidity, and a multi-day forecast.',
  tools: [
    {
      name: 'get_weather',
      description: 'Get current weather and forecast for a location.',
      parameters: z.object({
        location: z.string().describe('City name or location to get weather for'),
      }),
      isLauncher: true,
    },
    {
      name: 'show_weather_dashboard',
      description: 'Show an interactive weather dashboard for a location.',
      parameters: z.object({
        location: z.string().describe('City name or location to show dashboard for'),
      }),
    },
  ],
  sessionSchemaVersion: 1,
  uiUrl: null,
  enabled: true,
  authRequirements: 'none',
  allowedOrigins: [],
}

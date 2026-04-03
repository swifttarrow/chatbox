import {
  AppAdapter,
  type ToolCallInput,
  type ToolCallResult,
  type UserActionInput,
  type UserActionResult,
  type AppSnapshot,
} from '../adapter.js'

interface WeatherState {
  location: string | null
  lat: number | null
  lon: number | null
  current: unknown
  forecast: unknown
  lastUpdated: string | null
}

// In-memory cache keyed by (lat, lon) rounded to 2 decimals
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

async function geocode(location: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.results?.length) return null
  const r = data.results[0]
  return { lat: r.latitude, lon: r.longitude, name: r.name }
}

async function fetchWeather(lat: number, lon: number): Promise<any> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
  const res = await fetch(url)
  const data = await res.json()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

function formatWeatherText(location: string, data: any): string {
  const current = data.current
  const daily = data.daily
  let text = `Weather in ${location}:\n`
  text += `Temperature: ${current?.temperature_2m}°C\n`
  text += `Humidity: ${current?.relative_humidity_2m}%\n`
  text += `Wind: ${current?.wind_speed_10m} km/h\n\n`
  if (daily?.time) {
    text += 'Forecast:\n'
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
      text += `  ${daily.time[i]}: ${daily.temperature_2m_min[i]}°C - ${daily.temperature_2m_max[i]}°C\n`
    }
  }
  return text
}

export class WeatherAdapter extends AppAdapter {
  readonly appId = 'weather'

  getInitialState(): WeatherState {
    return { location: null, lat: null, lon: null, current: null, forecast: null, lastUpdated: null }
  }

  async onToolCall(input: ToolCallInput): Promise<ToolCallResult> {
    const { location } = input.parameters as { location: string }

    const geo = await geocode(location)
    if (!geo) {
      return { success: false, error: `Could not find location: ${location}` }
    }

    const data = await fetchWeather(geo.lat, geo.lon)
    const state: WeatherState = {
      location: geo.name,
      lat: geo.lat,
      lon: geo.lon,
      current: data.current,
      forecast: data.daily,
      lastUpdated: new Date().toISOString(),
    }

    const text = formatWeatherText(geo.name, data)

    if (input.toolName === 'show_weather_dashboard') {
      return {
        success: true,
        result: text,
        domainState: state,
        uiCommand: { type: 'init', payload: state },
      }
    }

    return { success: true, result: text, domainState: state }
  }

  async onUserAction(input: UserActionInput): Promise<UserActionResult> {
    if (input.action === 'change_location') {
      const location = input.payload.location as string
      if (!location) return { success: false, error: 'Location is required' }

      const geo = await geocode(location)
      if (!geo) return { success: false, error: `Could not find: ${location}` }

      const data = await fetchWeather(geo.lat, geo.lon)
      const state: WeatherState = {
        location: geo.name,
        lat: geo.lat,
        lon: geo.lon,
        current: data.current,
        forecast: data.daily,
        lastUpdated: new Date().toISOString(),
      }

      return {
        success: true,
        domainState: state,
        uiCommand: { type: 'state_patch', payload: state },
      }
    }

    return { success: false, error: `Unknown action: ${input.action}` }
  }

  getSnapshot(domainState: unknown, appSessionId: string): AppSnapshot {
    const state = domainState as WeatherState
    return {
      app: 'weather',
      appSessionId,
      stateVersion: 0,
      source: 'server_validated',
      summary: {
        location: state.location,
        temperature: (state.current as any)?.temperature_2m,
        humidity: (state.current as any)?.relative_humidity_2m,
        wind: (state.current as any)?.wind_speed_10m,
      },
    }
  }
}

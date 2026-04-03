# Task 003: Weather Dashboard Adapter

## Purpose

Implement a hybrid_session app that fetches weather data from a public API and renders an interactive dashboard. This demonstrates the external public (no user auth) integration pattern.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `server/src/apps/adapter.ts`, `server/src/apps/types.ts`

## Outputs

- Create: `server/src/apps/adapters/weather.ts`
- Create: `server/src/apps/definitions/weather.ts`
- Modify: `server/src/apps/definitions/index.ts` (add weather)

## Dependencies

- Prior task: none (parallel with 001)
- Required artifacts: `server/src/apps/adapter.ts`

## Constraints

- App type: `hybrid_session` (has persistent UI dashboard)
- External API: Open-Meteo (free, no API key needed)
- Tools: `get_weather` (current + forecast for a location), `show_weather_dashboard` (render interactive UI)
- Domain state: `{ location, lat, lon, current, forecast, lastUpdated }`
- Cache responses for 10 minutes to avoid excessive API calls. Cache is keyed by `(lat, lon)` rounded to 2 decimal places. Use an in-memory `Map` with TTL check (no external cache needed for MVP). Cache is global (not per-user) since weather data is public.
- Handle: location lookup by city name (use Open-Meteo geocoding API)

## Required Changes

1. Create `server/src/apps/definitions/weather.ts`:
   - `id`: 'weather'
   - `appType`: 'hybrid_session'
   - `displayName`: 'Weather Dashboard'
   - `description`: 'Get current weather and forecasts for any location. Shows temperature, conditions, wind, humidity, and a multi-day forecast.'
   - Tools (parameters as Zod schemas):
     - `get_weather`: params `z.object({ location: z.string().describe('City name or location to get weather for') })` -- fetch weather and return text summary
     - `show_weather_dashboard`: params `z.object({ location: z.string().describe('City name or location to show dashboard for') })` -- fetch weather and open dashboard UI
2. Create `server/src/apps/adapters/weather.ts`:
   - `onToolCall`:
     - `get_weather`: call Open-Meteo geocoding API to resolve location -> call weather API -> format text response -> update domain state
     - `show_weather_dashboard`: same as get_weather but also return `uiCommand` to open/update dashboard
   - `onUserAction`:
     - `change_location`: fetch weather for new location, update state
     - `refresh`: re-fetch current location
   - `getSnapshot`: compact weather summary for model context
   - `getInitialState`: `{ location: null }`
   - HTTP calls to Open-Meteo: use `fetch()` (Node 20 native)
3. Update definitions index

## Acceptance Criteria

- [ ] `get_weather({location: "Chicago"})` returns current weather text
- [ ] `show_weather_dashboard({location: "New York"})` updates domain state and triggers UI
- [ ] Open-Meteo API calls work without API key
- [ ] Location geocoding resolves city names to coordinates
- [ ] Domain state includes current conditions and forecast
- [ ] Invalid location returns clear error

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] `curl http://localhost:3100/api/apps` lists weather
- [ ] Send "what's the weather in Tokyo?" in chat -> correct response

## Stop and Ask

- If Open-Meteo is down or unreachable, consider OpenWeatherMap (requires free API key) as fallback

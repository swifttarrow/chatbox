# Task 004: Weather Dashboard Iframe App

## Purpose

Build an interactive weather dashboard iframe app showing current conditions, forecast, and allowing location changes.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `src/shared/bridge/protocol.ts`, `apps/chess/` (reference)

## Outputs

- Create: `apps/weather/package.json`
- Create: `apps/weather/vite.config.ts`
- Create: `apps/weather/tsconfig.json`
- Create: `apps/weather/index.html`
- Create: `apps/weather/src/main.tsx`
- Create: `apps/weather/src/App.tsx`
- Create: `apps/weather/src/components/CurrentWeather.tsx`
- Create: `apps/weather/src/components/Forecast.tsx`
- Create: `apps/weather/src/bridge.ts`
- Modify: `server/src/apps/definitions/weather.ts` (set uiUrl)

## Dependencies

- Prior task: `003-weather-adapter.md`
- Required artifacts: Weather adapter, `src/shared/bridge/protocol.ts`

## Constraints

- Same postMessage protocol as chess
- Display: location name, current temp, conditions icon, humidity, wind, 7-day forecast
- Allow user to change location via input field (sends `app.user_action` with `change_location`)
- Responsive layout that works in the chat iframe width (~400-600px)
- Use simple CSS or Tailwind for styling (no heavy UI library)

## Required Changes

1. Create `apps/weather/` project structure (mirror chess app)
2. Dependencies: `react`, `react-dom`
3. Create bridge.ts (same pattern)
4. Create components:
   - `CurrentWeather.tsx`: temp, conditions, humidity, wind display
   - `Forecast.tsx`: multi-day forecast cards/rows
5. Create App.tsx:
   - On `app.init` / `app.state_patch`: render weather data
   - Location search input -> sends `change_location` user action
   - Loading states while fetching
6. Dev server on port 3202
7. Update weather definition `uiUrl`

## Acceptance Criteria

- [ ] Dashboard displays current weather with temperature, conditions, wind, humidity
- [ ] 7-day forecast rendered as cards or rows
- [ ] Location search works (type city, press enter, dashboard updates)
- [ ] Receives state patches and updates accordingly
- [ ] `pnpm --filter @chatbox/weather-app dev` starts on port 3202

## Validation

- [ ] Ask "show me the weather in London" -> dashboard appears with London weather
- [ ] Change location in dashboard -> new weather loads
- [ ] `pnpm --filter @chatbox/weather-app build` succeeds

## Stop and Ask

- If weather data shape from Open-Meteo differs from expected, adapt the component to match actual API response

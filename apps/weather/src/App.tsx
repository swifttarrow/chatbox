import { useState, useEffect, useCallback } from 'react'
import { sendToHost, onHostMessage } from './bridge'
import { AppCommandTypes, AppEventTypes } from './bridge-constants'
import type { WeatherState } from './types'
import CurrentWeather from './components/CurrentWeather'
import Forecast from './components/Forecast'

const INITIAL_STATE: WeatherState = {
  location: null,
  lat: null,
  lon: null,
  current: null,
  forecast: null,
  lastUpdated: null,
}

export default function App() {
  const [weather, setWeather] = useState<WeatherState>(INITIAL_STATE)
  const [searchInput, setSearchInput] = useState('')

  const applyDomainState = useCallback((state: Partial<WeatherState>) => {
    setWeather((prev) => ({ ...prev, ...state }))
  }, [])

  useEffect(() => {
    const unsubscribe = onHostMessage((type, payload) => {
      switch (type) {
        case AppCommandTypes.INIT:
        case AppCommandTypes.STATE_PATCH: {
          const msg = payload as { domainState: WeatherState }
          if (msg.domainState) {
            applyDomainState(msg.domainState)
          }
          break
        }
        case AppCommandTypes.RESET:
          setWeather(INITIAL_STATE)
          break
      }
    })
    return unsubscribe
  }, [applyDomainState])

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) return
    sendToHost(AppEventTypes.USER_ACTION, {
      action: 'change_location',
      data: { location: trimmed },
    })
  }, [searchInput])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch]
  )

  const hasData = weather.current !== null

  return (
    <div className="weather-dashboard">
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search location..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>

      {!hasData ? (
        <div className="loading-state">
          <p>Loading...</p>
          <p className="loading-hint">Waiting for weather data</p>
        </div>
      ) : (
        <>
          <CurrentWeather
            location={weather.location}
            current={weather.current}
            lastUpdated={weather.lastUpdated}
          />
          {weather.forecast && <Forecast forecast={weather.forecast} />}
        </>
      )}
    </div>
  )
}

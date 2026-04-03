import { getWeatherDescription, getWeatherEmoji } from '../weather-codes'

interface CurrentWeatherProps {
  location: string | null
  current: {
    temperature_2m?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
    weather_code?: number
  } | null
  lastUpdated: string | null
}

export default function CurrentWeather({ location, current, lastUpdated }: CurrentWeatherProps) {
  if (!current) return null

  const description = getWeatherDescription(current.weather_code)
  const emoji = getWeatherEmoji(current.weather_code)

  return (
    <div className="current-weather-card">
      <div className="current-header">
        <h2 className="location-name">{location ?? 'Unknown location'}</h2>
        {lastUpdated && (
          <span className="last-updated">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="current-body">
        <div className="temperature-section">
          <span className="weather-emoji">{emoji}</span>
          <span className="temperature">
            {current.temperature_2m !== undefined
              ? `${Math.round(current.temperature_2m)}`
              : '--'}
            <span className="unit">°C</span>
          </span>
        </div>

        <p className="weather-description">{description}</p>

        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Humidity</span>
            <span className="detail-value">
              {current.relative_humidity_2m !== undefined
                ? `${current.relative_humidity_2m}%`
                : '--'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Wind</span>
            <span className="detail-value">
              {current.wind_speed_10m !== undefined
                ? `${current.wind_speed_10m} km/h`
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

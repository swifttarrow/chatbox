import { getWeatherDescription, getWeatherEmoji } from '../weather-codes'

interface ForecastProps {
  forecast: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    weather_code?: number[]
  }
}

export default function Forecast({ forecast }: ForecastProps) {
  const { time, temperature_2m_max, temperature_2m_min, weather_code } = forecast

  if (!time || time.length === 0) return null

  const days = time.slice(0, 7)

  return (
    <div className="forecast-section">
      <h3 className="forecast-title">Forecast</h3>
      <div className="forecast-grid">
        {days.map((date, i) => {
          const code = weather_code?.[i]
          const high = temperature_2m_max?.[i]
          const low = temperature_2m_min?.[i]
          const emoji = getWeatherEmoji(code)
          const desc = getWeatherDescription(code)

          const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })

          return (
            <div key={date} className="forecast-card">
              <span className="forecast-date">{dayLabel}</span>
              <span className="forecast-emoji">{emoji}</span>
              <span className="forecast-desc">{desc}</span>
              <div className="forecast-temps">
                <span className="temp-high">
                  {high !== undefined ? `${Math.round(high)}°` : '--'}
                </span>
                <span className="temp-low">
                  {low !== undefined ? `${Math.round(low)}°` : '--'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

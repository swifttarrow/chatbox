export interface WeatherState {
  location: string | null
  lat: number | null
  lon: number | null
  current: {
    temperature_2m?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
    weather_code?: number
  } | null
  forecast: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    weather_code?: number[]
  } | null
  lastUpdated: string | null
}

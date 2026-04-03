export function getWeatherDescription(code: number | undefined): string {
  if (code === undefined) return 'Unknown'
  if (code === 0) return 'Clear sky'
  if (code >= 1 && code <= 3) return 'Partly cloudy'
  if (code >= 45 && code <= 48) return 'Fog'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 71 && code <= 75) return 'Snow'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Unknown'
}

export function getWeatherEmoji(code: number | undefined): string {
  if (code === undefined) return '?'
  if (code === 0) return '\u2600\uFE0F'
  if (code >= 1 && code <= 3) return '\u26C5'
  if (code >= 45 && code <= 48) return '\uD83C\uDF2B\uFE0F'
  if (code >= 51 && code <= 55) return '\uD83C\uDF26\uFE0F'
  if (code >= 61 && code <= 65) return '\uD83C\uDF27\uFE0F'
  if (code >= 71 && code <= 75) return '\u2744\uFE0F'
  if (code >= 80 && code <= 82) return '\uD83C\uDF26\uFE0F'
  if (code >= 95 && code <= 99) return '\u26A1'
  return '\uD83C\uDF24\uFE0F'
}

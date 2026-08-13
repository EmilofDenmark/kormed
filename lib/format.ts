const dkkFormatter = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 })
const dateFormatter = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDkk(amount: number): string {
  return `${dkkFormatter.format(Math.round(amount))} kr.`
}

/** "lørdag 22. august" -> "Lørdag 22. august" */
export function formatDateDaLong(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const formatted = dateFormatter.format(d)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/** "15:30" -> "Ca. 15:30" (approximate departure time, spec §4). */
export function formatApproxTime(timeStr: string): string {
  return `Ca. ${timeStr.slice(0, 5)}`
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export const timeFlexibilityLabels: Record<string, string> = {
  exact: 'Præcist tidspunkt',
  plus_minus_30: '+/- 30 minutter',
  plus_minus_60: '+/- 1 time',
  flexible: 'Fleksibel',
}

export const luggageLabels: Record<string, string> = {
  lille: 'Lille taske',
  almindelig: 'Almindelig bagage',
  stor: 'Stor bagage muligt',
}

export const petsLabels: Record<string, string> = {
  ja: 'Kæledyr tilladt',
  nej: 'Ingen kæledyr',
  efter_aftale: 'Kæledyr efter aftale',
}

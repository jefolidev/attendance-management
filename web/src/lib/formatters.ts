const WORK_SCHEDULE_TIMEZONE = 'America/Fortaleza'

const ptBrDateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: WORK_SCHEDULE_TIMEZONE,
  hourCycle: 'h23',
})

const ptBrDate = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const ptBrShortDate = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const ptBrWeekdayDate = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDateTime(value: string | Date) {
  return ptBrDateTime.format(new Date(value))
}

export function formatDate(value: string | Date) {
  const formatted = ptBrDate.format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatShortDate(value: string | Date) {
  const formatted = ptBrShortDate.format(new Date(value)).replace('.', '')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WORK_SCHEDULE_TIMEZONE,
    hourCycle: 'h23',
  }).format(new Date(value))
}

export function formatMinutes(minutes: number) {
  const formatted = formatDuration(minutes)
  return minutes < 0 ? `-${formatted}` : formatted
}

export function formatDuration(totalMinutes: number) {
  const absolute = Math.abs(totalMinutes)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60

  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

export function formatMinutesCompact(minutes: number) {
  const absolute = Math.abs(minutes)
  const hours = Math.floor(absolute / 60)
  const rest = absolute % 60
  const formatted = `${hours.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`

  return minutes < 0 ? `-${formatted}` : formatted
}

export function formatDateKey(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : ptBrWeekdayDate.format(parsed)
}

export function formatWeekdayDate(value: string | Date) {
  return ptBrWeekdayDate.format(new Date(value))
}

export function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response
    if (response?.data?.error) return response.data.error
  }

  return 'Não foi possível concluir a solicitação.'
}

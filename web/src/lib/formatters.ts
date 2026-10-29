const ptBrDateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const ptBrDate = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function formatDateTime(value: string | Date) {
  return ptBrDateTime.format(new Date(value))
}

export function formatDate(value: string | Date) {
  const formatted = ptBrDate.format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatMinutes(minutes: number) {
  const absolute = Math.abs(minutes)
  const hours = Math.floor(absolute / 60)
  const rest = absolute % 60
  const formatted = `${hours}h ${rest.toString().padStart(2, '0')}min`

  return minutes < 0 ? `-${formatted}` : formatted
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
  return Number.isNaN(parsed.getTime()) ? value : formatDate(parsed)
}

export function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response
    if (response?.data?.error) return response.data.error
  }

  return 'Não foi possível concluir a solicitação.'
}

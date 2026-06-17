const BRAZIL_LOCALE = 'pt-BR'
const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

function hasExplicitTimeZone(value) {
  return /([zZ]|[+-]\d{2}:\d{2})$/.test(value)
}

export function parseDateValue(value) {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim()
    if (!normalizedValue) return null

    const isoLikeValue = normalizedValue.includes('T') && !hasExplicitTimeZone(normalizedValue)
      ? `${normalizedValue}Z`
      : normalizedValue

    const parsed = new Date(isoLikeValue)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDateTime(value, formatterOptions = {}) {
  const parsed = parseDateValue(value)
  if (!parsed) return ''

  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
    ...formatterOptions,
  }).format(parsed)
}

export function formatDate(value, formatterOptions = {}) {
  const parsed = parseDateValue(value)
  if (!parsed) return ''

  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    timeZone: BRAZIL_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...formatterOptions,
  }).format(parsed)
}

export function getDateTimestamp(value) {
  const parsed = parseDateValue(value)
  return parsed ? parsed.getTime() : 0
}

export { BRAZIL_LOCALE, BRAZIL_TIME_ZONE }

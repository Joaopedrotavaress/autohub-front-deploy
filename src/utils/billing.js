import { formatDateTime as formatBrazilDateTime } from './dateTime'

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const SUBSCRIPTION_STATUS_CONFIG = {
  ATIVA: { label: 'Ativa', tone: 'active', icon: 'check_circle' },
  PENDENTE: { label: 'Pagamento pendente', tone: 'pending', icon: 'schedule' },
  INADIMPLENTE: { label: 'Pagamento em atraso', tone: 'cancelled', icon: 'error' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral', icon: 'block' },
  EXPIRADA: { label: 'Expirada', tone: 'neutral', icon: 'hourglass_empty' },
}

export function getSubscriptionStatusConfig(status) {
  const normalizedStatus = String(status || '').trim().toUpperCase()

  return SUBSCRIPTION_STATUS_CONFIG[normalizedStatus] || {
    label: normalizedStatus || 'Pendente',
    tone: 'neutral',
    icon: 'info',
  }
}

export function isPremiumPlan(tipo) {
  return String(tipo || '').trim().toUpperCase() === 'PREMIUM'
}

export function formatCurrency(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'R$ 0,00'
  }

  return CURRENCY_FORMATTER.format(amount)
}

export function formatDateTime(value) {
  return formatBrazilDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

import { formatDateTime as formatBrazilDateTime, getDateTimestamp } from '../../utils/dateTime'

export const ORDER_STATUS_META = {
  PENDENTE: {
    label: 'Pendente',
    shortLabel: 'Aguardando início',
    description: 'A ordem foi registrada e aguarda atendimento.',
    icon: 'schedule',
    tone: 'pending',
  },
  EM_ANDAMENTO: {
    label: 'Em andamento',
    shortLabel: 'Em atendimento',
    description: 'O veículo está em manutenção ou análise.',
    icon: 'build',
    tone: 'active',
  },
  CONCLUIDO: {
    label: 'Concluído',
    shortLabel: 'Finalizado',
    description: 'A ordem foi encerrada e o veículo está pronto.',
    icon: 'task_alt',
    tone: 'done',
  },
  CANCELADO: {
    label: 'Cancelado',
    shortLabel: 'Interrompido',
    description: 'O atendimento foi cancelado antes da entrega final.',
    icon: 'cancel',
    tone: 'cancelled',
  },
}


export const ORDER_STATUS_TRANSITIONS = {
  PENDENTE: ['EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'],
  EM_ANDAMENTO: ['PENDENTE', 'CONCLUIDO', 'CANCELADO'],
  CONCLUIDO: ['PENDENTE', 'EM_ANDAMENTO', 'CANCELADO'],
  CANCELADO: ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO'],
}

export const TIMELINE_EVENT_META = {
  STATUS_ALTERADO: {
    label: 'Status atualizado',
    icon: 'sync_alt',
  },
  SERVICO_ADICIONADO: {
    label: 'Serviço incluído',
    icon: 'playlist_add',
  },
  ORDEM_CRIADA: {
    label: 'Ordem criada',
    icon: 'note_add',
  },
}


export function formatDateTime(dateValue) {
  return formatBrazilDateTime(dateValue) || '-'
}

export function getStatusMeta(status) {
  return ORDER_STATUS_META[status] || ORDER_STATUS_META.PENDENTE
}

export function normalizeSearchTerm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s-]/g, '')
}

export function getOrderReferenceTime(order) {
  const reference = order?.atualizadoEm || order?.dataConclusao || order?.dataInicio || order?.criadoEm || 0
  return getDateTimestamp(reference)
}

export function getHistoryReferenceTime(item) {
  return getDateTimestamp(item?.alteradoEm || 0)
}

export function getOrderShortCode(orderId) {
  return String(orderId || '').replace(/-/g, '').slice(0, 8).toUpperCase() || 'SEM ID'
}

export function getTimelineEventMeta(tipoEvento) {
  return TIMELINE_EVENT_META[tipoEvento] || {
    label: 'Atualização',
    icon: 'history',
  }
}

export function buildStepState(currentStatus, stepKey) {
  if (currentStatus === 'CANCELADO') {
    if (stepKey === 'CANCELADO') return 'cancelled'
    if (stepKey === 'PENDENTE') return 'completed'
    return 'neutral'
  }

  const order = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO']
  const currentIndex = order.indexOf(currentStatus)
  const stepIndex = order.indexOf(stepKey)

  if (stepIndex === -1) return 'neutral'
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

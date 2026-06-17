import apiFetch, { API_BASE_URL } from './apiFetch'
import { getToken } from './authService'

export const KAFKA_STATUS = {
  0: 'PENDENTE',
  1: 'PROCESSANDO',
  2: 'PROCESSADO',
  3: 'FALHOU',
  PENDENTE: 'PENDENTE',
  PROCESSANDO: 'PROCESSANDO',
  PROCESSADO: 'PROCESSADO',
  FALHOU: 'FALHOU',
}

export const KAFKA_STATUS_LABELS = {
  PENDENTE: 'Pendente',
  PROCESSANDO: 'Processando',
  PROCESSADO: 'Processado',
  FALHOU: 'Falhou',
}

export const KAFKA_STATUS_DESCRIPTIONS = {
  PENDENTE: 'Registrado e aguardando consumo.',
  PROCESSANDO: 'Consumer recebeu e está tratando.',
  PROCESSADO: 'Consumer finalizou com sucesso.',
  FALHOU: 'Consumer registrou falha no processamento.',
}

export function normalizeKafkaStatus(value) {
  const normalized = KAFKA_STATUS[String(value).toUpperCase()]
  return normalized || 'PENDENTE'
}

export function normalizeKafkaEvent(evt) {
  const statusProcessamento = normalizeKafkaStatus(evt.statusProcessamento ?? evt.StatusProcessamento)

  return {
    eventId: evt.eventId || evt.EventId,
    dataHora: evt.dataHora || evt.DataHora,
    tipoEvento: evt.tipoEvento || evt.TipoEvento,
    version: evt.version || evt.Version || 1,
    topic: evt.topic || evt.Topic,
    entidadeTipo: evt.entidadeTipo || evt.EntidadeTipo,
    entidadeId: evt.entidadeId || evt.EntidadeId,
    oficinaNome: evt.oficinaNome || evt.OficinaNome,
    assinaturaId: evt.assinaturaId || evt.AssinaturaId,
    payloadResumo: evt.payloadResumo || evt.PayloadResumo,
    statusProcessamento,
    statusLabel: KAFKA_STATUS_LABELS[statusProcessamento],
    statusDescription: KAFKA_STATUS_DESCRIPTIONS[statusProcessamento],
    mensagemErro: evt.mensagemErro || evt.MensagemErro,
    processadoEm: evt.processadoEm || evt.ProcessadoEm,
  }
}

export async function getKafkaMonitorEvents() {
  return apiFetch('/api/kafka-monitor')
}

export function createKafkaMonitorStream() {
  const token = getToken()
  const query = token ? `?access_token=${encodeURIComponent(token)}` : ''
  return new EventSource(`${API_BASE_URL}/api/kafka-monitor/stream${query}`)
}

import { apiFetch } from './apiFetch'

function getValue(source, keys, fallback = null) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function parseMoney(value) {
  if (typeof value === 'number') {
    return value
  }

  const normalized = String(value ?? '').replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePlanoItem(item) {
  const source = item?.plano || item?.data || item
  if (!source) {
    return null
  }

  const id = String(getValue(source, ['id', 'Id', 'planoId', 'PlanoId'], '')).trim()
  if (!id) {
    return null
  }

  return {
    id,
    nome: String(getValue(source, ['nome', 'Nome'], '')).trim(),
    descricao: String(getValue(source, ['descricao', 'Descricao'], '')).trim(),
    tipo: String(getValue(source, ['tipo', 'Tipo'], '')).trim(),
    preco: parseMoney(getValue(source, ['preco', 'Preco'], 0)),
    duracaoDias: parseInteger(getValue(source, ['duracaoDias', 'DuracaoDias'], 0)),
    abacatePayProductId: String(getValue(source, ['abacatePayProductId', 'AbacatePayProductId'], '')).trim(),
    criadoEm: getValue(source, ['criadoEm', 'CriadoEm'], ''),
    atualizadoEm: getValue(source, ['atualizadoEm', 'AtualizadoEm'], ''),
  }
}

function extractPlanoCollection(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.planos)) {
    return payload.planos
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

export function normalizePlanoList(payload) {
  return extractPlanoCollection(payload).map(normalizePlanoItem).filter(Boolean)
}

export function normalizePlanoResponse(payload) {
  return normalizePlanoItem(payload)
}

export async function getPlanos() {
  const response = await apiFetch('/api/plano')
  return normalizePlanoList(response)
}

export async function getPlanoById(id) {
  const response = await apiFetch(`/api/plano/${id}`)
  return normalizePlanoResponse(response)
}

export async function createPlano(payload) {
  const response = await apiFetch('/api/plano', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizePlanoResponse(response)
}

export async function updatePlano(id, payload) {
  const response = await apiFetch(`/api/plano/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return normalizePlanoResponse(response)
}

export async function deletePlano(id) {
  return apiFetch(`/api/plano/${id}`, {
    method: 'DELETE',
  })
}

import { apiFetch } from './apiFetch'

function getValue(source, keys, fallback = null) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false
  }

  return fallback
}

function normalizeAssinaturaItem(item) {
  const source = item?.assinatura || item?.data || item
  if (!source) {
    return null
  }

  const id = String(getValue(source, ['id', 'Id'], '')).trim()
  if (!id) {
    return null
  }

  return {
    id,
    usuarioId: String(getValue(source, ['usuarioId', 'UsuarioId'], '')).trim(),
    planoId: String(getValue(source, ['planoId', 'PlanoId'], '')).trim(),
    status: String(getValue(source, ['status', 'Status'], '')).trim().toUpperCase(),
    renovacaoAutomatica: parseBoolean(getValue(source, ['renovacaoAutomatica', 'RenovacaoAutomatica'], false)),
    dataInicio: getValue(source, ['dataInicio', 'DataInicio'], ''),
    dataFim: getValue(source, ['dataFim', 'DataFim'], ''),
    dataRenovacao: getValue(source, ['dataRenovacao', 'DataRenovacao'], ''),
    ultimoPagamentoEm: getValue(source, ['ultimoPagamentoEm', 'UltimoPagamentoEm'], ''),
    abacatePaySubscriptionId: String(getValue(source, ['abacatePaySubscriptionId', 'AbacatePaySubscriptionId'], '')).trim(),
    abacatePayBillId: String(getValue(source, ['abacatePayBillId', 'AbacatePayBillId'], '')).trim(),
    checkoutUrl: String(getValue(source, ['checkoutUrl', 'CheckoutUrl', 'checkout_url'], '')).trim(),
    criadoEm: getValue(source, ['criadoEm', 'CriadoEm'], ''),
    atualizadoEm: getValue(source, ['atualizadoEm', 'AtualizadoEm'], ''),
  }
}

function extractAssinaturaCollection(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.assinaturas)) {
    return payload.assinaturas
  }

  if (Array.isArray(payload?.items)) {
    return payload.items
  }

  return []
}

function extractCheckoutUrl(payload) {
  const source = payload?.data || payload?.assinatura || payload
  return String(getValue(source, ['checkoutUrl', 'CheckoutUrl', 'checkout_url', 'url'], '')).trim()
}

export function normalizeAssinaturaList(payload) {
  return extractAssinaturaCollection(payload).map(normalizeAssinaturaItem).filter(Boolean)
}

export function normalizeAssinaturaResponse(payload) {
  return normalizeAssinaturaItem(payload)
}

export function normalizeCriacaoAssinaturaResponse(payload) {
  return {
    assinatura: normalizeAssinaturaItem(payload),
    checkoutUrl: extractCheckoutUrl(payload),
    raw: payload,
  }
}

export async function getAssinaturas() {
  const response = await apiFetch('/api/assinatura')
  return normalizeAssinaturaList(response)
}

export async function getAssinaturaById(id) {
  const response = await apiFetch(`/api/assinatura/${id}`)
  return normalizeAssinaturaResponse(response)
}

export async function createAssinatura(payload) {
  const { status: _status, ...requestBody } = payload || {}

  const response = await apiFetch('/api/assinatura', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  return normalizeCriacaoAssinaturaResponse(response)
}

export async function updateAssinatura(id, payload) {
  const response = await apiFetch(`/api/assinatura/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return normalizeAssinaturaResponse(response)
}

export async function deleteAssinatura(id) {
  return apiFetch(`/api/assinatura/${id}`, {
    method: 'DELETE',
  })
}

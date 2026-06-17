import { apiFetch, API_BASE_URL } from './apiFetch'
import { getToken } from './authService'

function getOfficeUserId(oficina) {
  return String(
    oficina?.usuarioId
    ?? oficina?.UsuarioId
    ?? oficina?.idUsuario
    ?? oficina?.IdUsuario
    ?? oficina?.usuario?.id
    ?? oficina?.Usuario?.Id
    ?? oficina?.usuario?.Id
    ?? oficina?.Usuario?.id
    ?? '',
  ).trim()
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function buildOficinaFormData(dados, imagens = []) {
  const formData = new FormData()
  const cep = dados.cep || dados.Cep || dados.zipCode || dados.postalCode || ''

  formData.append('nome', dados.nome || '')
  formData.append('descricao', dados.descricao || '')
  formData.append('cnpj', dados.cnpj || '')
  formData.append('telefone', dados.telefone || '')
  formData.append('cep', cep)
  formData.append('Cep', cep)
  formData.append('zipCode', cep)
  formData.append('postalCode', cep)
  formData.append('endereco', dados.endereco || '')
  formData.append('latitude', String(dados.latitude ?? 0))
  formData.append('longitude', String(dados.longitude ?? 0))
  formData.append('imagemUrl', dados.imagemUrl || '')
  ;(Array.isArray(imagens) ? imagens : [imagens]).filter(Boolean).forEach((imagem) => {
    formData.append('imagem', imagem)
  })
  return formData
}

function getApiErrorMessage(data, fallback) {
  if (!data) return fallback
  if (data.mensagem) return data.mensagem
  if (data.message) return data.message
  if (data.title && data.errors) {
    const details = Object.values(data.errors).flat().filter(Boolean).join(' ')
    return details ? `${data.title}: ${details}` : data.title
  }
  if (typeof data === 'string') return data
  return fallback
}

async function submitOficinaForm(endpoint, method, dados, imagens = []) {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: buildOficinaFormData(dados, imagens),
    cache: 'no-store',
  })

  if (response.status === 401) {
    window.location.assign('/login')
    throw new Error('Sessão expirada ou usuário não autenticado.')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const msg = getApiErrorMessage(data, response.statusText || 'Erro ao salvar oficina')
    console.error('Erro ao salvar oficina:', { status: response.status, data })
    const err = new Error(msg)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

/**
 * Buscar dados de uma oficina pelo ID
 * @param {string} id - ID da oficina
 * @returns {Promise<Object>} Dados da oficina
 */
export async function getOficinaById(id) {
  return apiFetch(`/api/Oficina/${id}`)
}

export async function getOficinaDetalhe(id, options = {}) {
  const query = buildQueryString({
    latitude: options.latitude,
    longitude: options.longitude,
    cepOrigem: options.cepOrigem,
  })

  return apiFetch(`/api/Oficina/${id}/detalhe${query}`)
}

/**
 * Buscar todas as oficinas
 * @returns {Promise<Array>} Lista de oficinas
 */
export async function getAllOficinas() {
  return apiFetch('/api/Oficina')
}

export async function getMinhaOficina() {
  return apiFetch('/api/Oficina/me')
}

export async function getMinhasOficinas() {
  return apiFetch('/api/Oficina/minhas')
}

export async function getMinhaOficinaPrivada(id) {
  return apiFetch(`/api/Oficina/minhas/${id}`)
}

export async function getOficinasProximas({ 
  latitude, 
  longitude, 
  cepOrigem,
  raioKm = 25,
  avaliacaoMinima,
  tipoServico,
  especialidade,
  precoMin,
  precoMax,
  distanciaMaxKm
}) {
  const query = buildQueryString({ 
    latitude, 
    longitude, 
    cepOrigem,
    distanciaMaxKm: distanciaMaxKm ?? raioKm,
    avaliacaoMinima,
    tipoServico,
    especialidade,
    precoMin,
    precoMax
  })
  return apiFetch(`/api/Oficina/proximas${query}`)
}

/**
 * Atualizar dados de uma oficina
 * @param {string} id - ID da oficina
 * @param {Object} dados - {nome, descricao, cnpj, endereco}
 * @returns {Promise<Object>} Oficina atualizada
 */
export async function updateOficina(id, dados, imagens = []) {
  return submitOficinaForm(`/api/Oficina/${id}`, 'PUT', dados, imagens)
}

/**
 * Deletar uma oficina
 * @param {string} id - ID da oficina
 * @returns {Promise<boolean>} Sucesso da operação
 */
export async function deleteOficina(id) {
  await apiFetch(`/api/Oficina/${id}`, { method: 'DELETE' })
  return true
}

export default {
  getOficinaById,
  getOficinaDetalhe,
  getAllOficinas,
  getMinhaOficina,
  getMinhasOficinas,
  getMinhaOficinaPrivada,
  getOficinasProximas,
  updateOficina,
  deleteOficina,
}

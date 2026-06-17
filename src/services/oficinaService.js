import { apiFetch, API_BASE_URL } from './apiFetch'
import { getToken } from './authService'

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
 * Buscar todas as oficinas do usuário autenticado
 * @returns {Promise<Array>} Lista de oficinas
 */
export async function getMinhasOficinas() {
  try {
    return await apiFetch('/api/Oficina/minhas')
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

/**
 * Criar nova oficina para o usuário autenticado
 * @param {Object} dados - {nome, descricao, cnpj, endereco, latitude, longitude}
 * @returns {Promise<Object>} Oficina criada com ID
 */
export async function createOficina(dados, imagens = []) {
  return submitOficinaForm('/api/Oficina/me', 'POST', dados, imagens)
}

export default {
  getMinhasOficinas,
  createOficina,
}

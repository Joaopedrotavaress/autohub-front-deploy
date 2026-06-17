import { getToken, handleUnauthorized } from './authService'
export { API_BASE_URL } from './apiConfig'
import { API_BASE_URL } from './apiConfig'

function parseJSONSafe(res) {
  return res.text().then(text => {
    try {
      return text ? JSON.parse(text) : null
    } catch (e) {
      return null
    }
  })
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken()
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    ...(options.body && !isFormDataBody && { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  })

  if (response.status === 401) {
    handleUnauthorized()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    throw new Error('Sessão expirada ou usuário não autenticado.')
  }

  // try to return parsed json when possible, otherwise return raw response
  const data = await parseJSONSafe(response)
  if (!response.ok) {
    const msg = (data && data.mensagem) || response.statusText || 'Erro na requisição'
    const err = new Error(msg)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

export default apiFetch

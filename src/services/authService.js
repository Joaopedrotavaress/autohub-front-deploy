import { API_BASE_URL } from './apiConfig'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'usuario'

let unauthorizedHandler = null

function parseJsonSafe(rawValue) {
  try {
    return rawValue ? JSON.parse(rawValue) : null
  } catch {
    return null
  }
}

function getValue(source, keys, fallback = null) {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key]
    }
  }

  return fallback
}

function normalizeGuidList(source, keys) {
  const raw = getValue(source, keys, [])
  if (!Array.isArray(raw)) return []

  return raw
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

export function normalizeAuthenticatedUser(payload) {
  const source = payload?.usuario || payload?.user || payload
  if (!source) return null

  const id = String(getValue(source, ['id', 'Id', 'usuarioId', 'UsuarioId'], '')).trim()
  if (!id) return null

  const role = String(getValue(source, ['role', 'Role'], '')).trim()

  return {
    id,
    nome: String(getValue(source, ['nome', 'Nome'], '')).trim(),
    email: String(getValue(source, ['email', 'Email'], '')).trim(),
    tipo: getValue(source, ['tipo', 'Tipo'], role || null),
    role,
    oficinaId: getValue(source, ['oficinaId', 'OficinaId'], null),
    oficinasIds: normalizeGuidList(source, ['oficinasIds', 'OficinasIds']),
    criadoEm: getValue(source, ['criadoEm', 'CriadoEm'], ''),
    atualizadoEm: getValue(source, ['atualizadoEm', 'AtualizadoEm'], ''),
  }
}

export function persistSession({ token, usuario }) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  if (usuario) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario))
  } else {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

export function handleUnauthorized() {
  logout()

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler()
  }
}

export async function login(credenciais) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credenciais.email, senha: credenciais.senha }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.mensagem || 'Erro ao fazer login')
  }

  const data = await response.json()
  const token = data?.token
  const usuario = normalizeAuthenticatedUser({
    ...data,
    id: data?.usuarioId,
  })

  if (!token) throw new Error('Resposta do servidor não contém token')
  if (!usuario) throw new Error('Resposta do servidor não contém os dados do usuário autenticado')

  persistSession({ token, usuario })
  return { token, usuario }
}

export async function getCurrentUser() {
  const token = getToken()

  if (!token) {
    throw new Error('Token JWT não encontrado para reidratar a sessão.')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    handleUnauthorized()
    throw new Error('Sessão expirada ou usuário não autenticado.')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.mensagem || 'Não foi possível carregar o usuário autenticado.')
  }

  const usuario = normalizeAuthenticatedUser(data)
  if (!usuario) {
    throw new Error('Resposta do servidor não contém os dados do usuário autenticado.')
  }

  persistSession({ token, usuario })
  return usuario
}

export function getToken() {

  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getUsuario() {
  return parseJsonSafe(localStorage.getItem(USER_STORAGE_KEY))
}

export function isAutenticado() {
  console.log('Verificando autenticação, token encontrado:', !!getToken());
  return !!getToken()
}

export function logout() {
  persistSession({ token: null, usuario: null })
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro ao enviar link de recuperação')
  }

  return data
}

export async function resetPassword({ email, token, novaSenha }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, novaSenha }),
  })

  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro ao redefinir senha')
  }

  return data
}

export default {
  login,
  getCurrentUser,
  getToken,
  getUsuario,
  isAutenticado,
  logout,
  forgotPassword,
  resetPassword,
  persistSession,
  handleUnauthorized,
  registerUnauthorizedHandler,
}

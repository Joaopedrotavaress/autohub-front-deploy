import { API_BASE_URL } from '../services/apiConfig'

/**
 * Constantes da aplicação
 * URLs, valores padrão, mensagens, etc.
 */

export const MESSAGES = {
  SUCCESS: 'Operação realizada com sucesso!',
  ERROR: 'Ocorreu um erro. Tente novamente.',
  LOADING: 'Carregando...',
}

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
}

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
}

export default {
  API_BASE_URL,
  MESSAGES,
  ROLES,
  THEMES,
}

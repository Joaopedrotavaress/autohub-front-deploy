const configuredApiUrl = import.meta.env.VITE_API_URL

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('VITE_API_URL precisa estar configurada em produção.')
}

export const API_BASE_URL = configuredApiUrl || 'http://localhost:8081'

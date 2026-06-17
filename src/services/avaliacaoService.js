import { apiFetch } from './apiFetch'

export async function createAvaliacao(payload) {
  return apiFetch('/api/Avaliacao', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export default {
  createAvaliacao,
}

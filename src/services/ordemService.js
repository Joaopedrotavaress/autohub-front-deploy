import { apiFetch } from './apiFetch'

export async function createOrdem(payload) {
  return apiFetch('/api/ordens-servico', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getOrdemById(id) {
  try {
    return await apiFetch(`/api/ordens-servico/${id}`)
  } catch (err) {
    if (err.status === 404) throw new Error('Ordem de servico nao encontrada')
    throw err
  }
}

export async function getOrdensByVeiculoId(veiculoId) {
  try {
    return await apiFetch(`/api/ordens-servico/veiculo/${veiculoId}`)
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

export async function getOrdensByOficinaId(oficinaId) {
  try {
    return await apiFetch(`/api/ordens-servico/oficina/${oficinaId}`)
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

export default {
  createOrdem,
  getOrdemById,
  getOrdensByVeiculoId,
  getOrdensByOficinaId,
}

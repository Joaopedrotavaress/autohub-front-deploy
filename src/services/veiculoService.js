import { apiFetch } from './apiFetch'

/**
 * Criar novo veículo do usuário autenticado
 * @param {Object} dados - {nome, marca, modelo, ano, placa, observacao}
 * @returns {Promise<Object>} Veículo criado com ID
 */
export async function createVeiculo(dados) {
  const anoPayload = Number.parseInt(String(dados.ano), 10)

  return apiFetch('/api/Veiculo/me', {
    method: 'POST',
    body: JSON.stringify({
      nome: dados.nome,
      marca: dados.marca,
      modelo: dados.modelo,
      ano: anoPayload,
      placa: dados.placa,
      observacao: dados.observacao,
    }),
  })
}

export async function getMyVeiculos() {
  try {
    return await apiFetch('/api/Veiculo/me')
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

export async function getAllVeiculos() {
  return apiFetch('/api/Veiculo')
}

export async function getVeiculosByUsuarioId(idUsuario) {
  if (!idUsuario) {
    return getMyVeiculos()
  }

  try {
    return await apiFetch(`/api/Veiculo/usuario/${idUsuario}`)
  } catch (err) {
    if (err.status === 404) return []
    throw err
  }
}

export async function getVeiculoById(id) {
  try {
    return await apiFetch(`/api/Veiculo/${id}`)
  } catch (err) {
    if (err.status === 404) throw new Error('Veiculo nao encontrado')
    throw err
  }
}

export default {
  createVeiculo,
  getMyVeiculos,
  getAllVeiculos,
  getVeiculosByUsuarioId,
  getVeiculoById,
}

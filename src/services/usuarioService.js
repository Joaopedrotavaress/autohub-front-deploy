import { apiFetch } from './apiFetch'

/**
 * Criar novo usuário/cliente
 * @param {Object} dados - {nome, email, senha, tipo}
 * @returns {Promise<Object>} Usuário criado com ID
 */
export async function createUsuario(dados) {
  return apiFetch('/api/Usuario', {
    method: 'POST',
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      tipo: dados.tipo !== undefined ? dados.tipo : 1,
    }),
  })
}

/**
 * Buscar usuário por ID
 */
export async function getUsuarioById(id) {
  try {
    return await apiFetch(`/api/Usuario/${id}`)
  } catch (err) {
    if (err.status === 404) throw new Error('Usuario nao encontrado')
    throw err
  }
}

export async function getAllUsuarios() {
  return apiFetch('/api/Usuario')
}

export async function getMecanicos() {
  return apiFetch('/api/Usuario/mecanicos')
}

export async function createMecanico(dados) {
  return apiFetch('/api/Usuario/mecanicos', {
    method: 'POST',
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      senhaInicial: dados.senhaInicial,
      oficinasIds: Array.isArray(dados.oficinasIds) ? dados.oficinasIds : [],
    }),
  })
}

export async function updateMecanico(id, dados) {
  return apiFetch(`/api/Usuario/mecanicos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      senhaInicial: dados.senhaInicial || null,
      oficinasIds: Array.isArray(dados.oficinasIds) ? dados.oficinasIds : [],
    }),
  })
}

export async function removeMecanicoVinculo(id, oficinaId) {
  return apiFetch(`/api/Usuario/mecanicos/${id}/oficinas/${oficinaId}`, {
    method: 'DELETE',
  })
}

export default {
  createUsuario,
  getUsuarioById,
  getAllUsuarios,
  getMecanicos,
  createMecanico,
  updateMecanico,
  removeMecanicoVinculo,
}
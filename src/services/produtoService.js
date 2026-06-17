/**
 * Services - API e integração com backend
 * Chamadas HTTP, WebSocket, etc.
 */

import { apiFetch } from './apiFetch'

/**
 * Buscar lista de produtos
 */
export async function getProdutos() {
  return apiFetch('/api/produtos')
}

/**
 * Buscar um produto por ID
 */
export async function getProdutoById(id) {
  return apiFetch(`/api/produtos/${id}`)
}

/**
 * Criar novo produto
 */
export async function createProduto(dados) {
  return apiFetch('/api/produtos', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export default {
  getProdutos,
  getProdutoById,
  createProduto,
}

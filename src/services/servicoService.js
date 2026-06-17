import { apiFetch } from './apiFetch'

const CATEGORIA_SERVICO = {
  PREVENCAO: 0,
  MANUTENCAO: 1,
  ESTETICA: 2,
}

function normalizeCategoriaServico(status) {
  if (typeof status === 'number') return status
  return CATEGORIA_SERVICO[String(status || '').trim().toUpperCase()]
}

function buildServicoFormData(dados) {
  const formData = new FormData()
  formData.append('Nome', String(dados?.nome ?? '').trim())
  formData.append('Descricao', String(dados?.descricao ?? '').trim())
  formData.append('Preco', String(dados?.preco ?? '0'))
  formData.append('Status', String(normalizeCategoriaServico(dados?.status) ?? CATEGORIA_SERVICO.PREVENCAO))
  formData.append('OficinaId', String(dados?.oficinaId ?? '').trim())
  formData.append('ImagemUrl', String(dados?.imagemUrl ?? '').trim())

  const imagens = Array.isArray(dados?.imagens) ? dados.imagens : [dados?.imagem]
  imagens.filter((imagem) => imagem instanceof File).forEach((imagem) => {
    formData.append('imagem', imagem)
  })

  return formData
}

export async function getAllServicos() {
  return apiFetch('/api/Servico')
}

export async function getServicosByOficinaId(oficinaId) {
  return apiFetch(`/api/Servico/oficina/${oficinaId}`)
}

export async function getServicoById(id) {
  try {
    return await apiFetch(`/api/Servico/${id}`)
  } catch (err) {
    if (err.status === 404) throw new Error('Servico nao encontrado')
    throw err
  }
}

export async function createServico(dados) {
  return apiFetch('/api/Servico', {
    method: 'POST',
    body: buildServicoFormData(dados),
  })
}

export async function updateServico(id, dados) {
  return apiFetch(`/api/Servico/${id}`, {
    method: 'PUT',
    body: buildServicoFormData(dados),
  })
}

export async function deleteServico(id) {
  await apiFetch(`/api/Servico/${id}`, { method: 'DELETE' })
  return true
}

export default {
  getAllServicos,
  getServicosByOficinaId,
  getServicoById,
  createServico,
  updateServico,
  deleteServico,
}

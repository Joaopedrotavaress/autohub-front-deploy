import { apiFetch } from './apiFetch'

export async function getServiceTrackingByOficinaId(oficinaId) {
  return apiFetch(`/api/acompanhamento-ordens/oficinas/${oficinaId}`)
}

export async function getServiceTrackingOrderDetail(ordemId) {
  return apiFetch(`/api/acompanhamento-ordens/ordens/${ordemId}`)
}

export async function updateServiceTrackingStatus(ordemId, status) {
  return apiFetch(`/api/acompanhamento-ordens/ordens/${ordemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function getServiceTrackingStatusHistory(ordemId) {
  return apiFetch(`/api/acompanhamento-ordens/ordens/${ordemId}/historico`)
}

export async function getServiceTrackingAvailableServices(ordemId) {
  return apiFetch(`/api/acompanhamento-ordens/ordens/${ordemId}/servicos-disponiveis`)
}

export async function addServiceTrackingItem(ordemId, payload) {
  return apiFetch(`/api/acompanhamento-ordens/ordens/${ordemId}/itens`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getServiceTrackingDriverView(ordemId) {
  return apiFetch(`/api/acompanhamento-ordens/motorista/ordens/${ordemId}`)
}

export default {
  getServiceTrackingByOficinaId,
  getServiceTrackingOrderDetail,
  updateServiceTrackingStatus,
  getServiceTrackingStatusHistory,
  getServiceTrackingAvailableServices,
  addServiceTrackingItem,
  getServiceTrackingDriverView,
}
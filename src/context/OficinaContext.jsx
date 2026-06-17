import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAppContext } from './AppContext'
import { getMinhasOficinas } from '../services/oficinaViewService'
import { normalizeOficina, getWorkshopStorageKey, isValidGuid } from '../utils/oficina'
import { getUserRole, ROLES } from '../utils/accessControl'

const OficinaContext = createContext({
  oficinas: [],
  oficinaAtiva: null,
  oficinaAtivaId: '',
  loading: false,
  error: '',
  hasProfessionalWorkshops: false,
  setOficinaAtiva: () => {},
  refreshOficinas: async () => [],
})

function canManageProfessionalWorkshops(role) {
  return role === ROLES.ADMIN || role === ROLES.DONO_OFICINA || role === ROLES.MECANICO
}

function resolveInitialActiveOficinaId(oficinas, user, storedId) {
  const userOfficeIds = Array.isArray(user?.oficinasIds)
    ? user.oficinasIds.map((value) => String(value || '').trim()).filter(Boolean)
    : []
  const userOficinaId = String(user?.oficinaId || '').trim()

  if (storedId && oficinas.some((oficina) => oficina.id === storedId)) {
    return storedId
  }

  const firstLinkedOfficeId = userOfficeIds.find((officeId) => oficinas.some((oficina) => oficina.id === officeId))
  if (firstLinkedOfficeId) {
    return firstLinkedOfficeId
  }

  if (isValidGuid(userOficinaId) && oficinas.some((oficina) => oficina.id === userOficinaId)) {
    return userOficinaId
  }

  return oficinas[0]?.id || ''
}

export function OficinaProvider({ children }) {
  const { user, authLoading } = useAppContext()
  const role = getUserRole(user)
  const userId = String(user?.id || '').trim()
  const [oficinas, setOficinas] = useState([])
  const [oficinaAtivaId, setOficinaAtivaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasProfessionalWorkshops = canManageProfessionalWorkshops(role) && Boolean(userId)

  const refreshOficinas = async () => {
    if (!hasProfessionalWorkshops) {
      setOficinas([])
      setOficinaAtivaId('')
      setError('')
      return []
    }

    setLoading(true)
    setError('')

    try {
      const result = await getMinhasOficinas()
      const normalized = (Array.isArray(result) ? result : []).map(normalizeOficina).filter((oficina) => oficina.id)
      const storageKey = getWorkshopStorageKey(userId)
      const storedId = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : ''
      const nextActiveId = resolveInitialActiveOficinaId(normalized, user, storedId)

      setOficinas(normalized)
      setOficinaAtivaId(nextActiveId)
      return normalized
    } catch (requestError) {
      if (requestError?.status === 404) {
        setOficinas([])
        setOficinaAtivaId('')
        setError('')
        return []
      }

      setOficinas([])
      setOficinaAtivaId('')
      setError(requestError?.message || 'Nao foi possivel carregar as oficinas do usuario autenticado.')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!hasProfessionalWorkshops) {
      setOficinas([])
      setOficinaAtivaId('')
      setLoading(false)
      setError('')
      return
    }

    refreshOficinas()
  }, [authLoading, hasProfessionalWorkshops, userId, role])

  useEffect(() => {
    if (!userId || !oficinaAtivaId) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(getWorkshopStorageKey(userId), oficinaAtivaId)
  }, [userId, oficinaAtivaId])

  const oficinaAtiva = useMemo(
    () => oficinas.find((oficina) => oficina.id === oficinaAtivaId) || null,
    [oficinas, oficinaAtivaId],
  )

  const value = useMemo(() => ({
    oficinas,
    oficinaAtiva,
    oficinaAtivaId,
    loading,
    error,
    hasProfessionalWorkshops,
    setOficinaAtiva: setOficinaAtivaId,
    refreshOficinas,
  }), [oficinas, oficinaAtiva, oficinaAtivaId, loading, error, hasProfessionalWorkshops])

  return <OficinaContext.Provider value={value}>{children}</OficinaContext.Provider>
}

export function useOficinaContext() {
  return useContext(OficinaContext)
}

export default OficinaContext
import { useEffect, useState } from 'react'
import { reverseGeocodeCoordinates } from '../services/geocodingService'

const LOCATION_STORAGE_KEY = 'autohub.user-location'
const LOCATION_MAX_AGE_MS = 30 * 60 * 1000

const DEFAULT_STATE = {
  latitude: null,
  longitude: null,
  cep: '',
  status: 'idle',
  error: '',
  capturedAt: '',
}

function readStoredLocation() {
  if (typeof window === 'undefined') return null

  try {
    const rawValue = window.localStorage.getItem(LOCATION_STORAGE_KEY)
    if (!rawValue) return null

    const parsed = JSON.parse(rawValue)
    if (typeof parsed?.latitude !== 'number' || typeof parsed?.longitude !== 'number') {
      return null
    }

    const capturedAt = typeof parsed?.capturedAt === 'string' ? Date.parse(parsed.capturedAt) : Number.NaN
    if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > LOCATION_MAX_AGE_MS) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function persistLocation({ latitude, longitude, cep = '', accuracy = null, capturedAt }) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
    latitude,
    longitude,
    cep,
    accuracy,
    capturedAt,
  }))
}

export function useUserLocation({ enabled = true } = {}) {
  const [state, setState] = useState(() => {
    const cached = readStoredLocation()
    if (!cached) return DEFAULT_STATE

    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      cep: cached.cep || '',
      status: 'cached',
      error: '',
      capturedAt: cached.capturedAt || '',
    }
  })

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((current) => ({
        ...current,
        status: enabled ? 'unsupported' : 'idle',
      }))
      return undefined
    }

    let cancelled = false
    const cached = readStoredLocation()

    setState((current) => ({
      ...current,
      status: cached ? 'refreshing' : 'loading',
      error: '',
    }))

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (cancelled) return

        const capturedAt = new Date().toISOString()
        let cep = ''

        try {
          const reverseGeocoded = await reverseGeocodeCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })

          cep = reverseGeocoded.cep || ''
        } catch {
          // O CEP é apenas um enriquecimento para melhorar a proximidade semântica.
        }

        if (cancelled) return

        persistLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          cep,
          accuracy: position.coords.accuracy,
          capturedAt,
        })

        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          cep,
          status: 'ready',
          error: '',
          capturedAt,
        })
      },
      (error) => {
        if (cancelled) return

        if (cached) {
          setState({
            latitude: cached.latitude,
            longitude: cached.longitude,
            cep: cached.cep || '',
            status: 'cached',
            error: error?.message || 'Usando sua ultima localizacao salva.',
            capturedAt: cached.capturedAt || '',
          })
          return
        }

        setState({
          latitude: null,
          longitude: null,
          cep: '',
          status: 'denied',
          error: error?.message || 'Não foi possível acessar sua localização.',
          capturedAt: '',
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}

export default useUserLocation

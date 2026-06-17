/**
 * Custom Hooks
 * Lógica reutilizável em múltiplos componentes
 * useState, useEffect, etc. encapsulados
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '../services/apiFetch'

export function useFetch(endpoint) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    apiFetch(endpoint)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [endpoint])

  return { data, loading, error }
}

export default useFetch

/**
 * Context API
 * Gerenciamento de estado global da aplicação
 * Autenticação, Tema, Idioma, etc.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import {
  getCurrentUser,
  getUsuario,
  getToken,
  logout as authLogout,
  persistSession,
  registerUnauthorizedHandler,
} from '../services/authService'

export const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => getUsuario())
  const [token, setToken] = useState(() => getToken())
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()))
  const [theme, setTheme] = useState('light')

  function login(usuario, newToken) {
    persistSession({ token: newToken, usuario })
    setUser(usuario)
    setToken(newToken)
    setAuthLoading(false)
  }

  function logout() {
    authLogout()
    setUser(null)
    setToken(null)
    setAuthLoading(false)
  }

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      setUser(null)
      setToken(null)
      setAuthLoading(false)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const rehydrateSession = async () => {
      const storedToken = getToken()

      if (!storedToken) {
        setAuthLoading(false)
        setUser(null)
        setToken(null)
        return
      }

      setAuthLoading(true)

      try {
        const authenticatedUser = await getCurrentUser()
        if (cancelled) return

        setUser(authenticatedUser)
        setToken(storedToken)
      } catch {
        if (cancelled) return

        authLogout()
        setUser(null)
        setToken(null)
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    rehydrateSession()

    return () => {
      cancelled = true
    }
  }, [])

  const value = {
    user,
    token,
    authLoading,
    login,
    logout,
    theme,
    setTheme,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}

export default AppContext

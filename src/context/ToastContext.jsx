import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { FEEDBACK_TONES } from '../components/ui/tokens'

const DEFAULT_DURATION = 4200

const ToastContext = createContext(null)

function buildToast(input) {
  const config = typeof input === 'string' ? { description: input } : input

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variant: config.variant || 'success',
    title: config.title || '',
    description: config.description || '',
    duration: Number.isFinite(config.duration) ? config.duration : DEFAULT_DURATION,
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismissToast = useCallback((toastId) => {
    const timer = timersRef.current.get(toastId)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(toastId)
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback((input) => {
    const toast = buildToast(input)

    setToasts((current) => [...current, toast])

    const timer = window.setTimeout(() => {
      dismissToast(toast.id)
    }, toast.duration)

    timersRef.current.set(toast.id, timer)

    return toast.id
  }, [dismissToast])

  const value = useMemo(() => ({
    showToast,
    dismissToast,
    success: (description, options = {}) => showToast({ ...options, description, variant: 'success' }),
    error: (description, options = {}) => showToast({ ...options, description, variant: 'error' }),
    warning: (description, options = {}) => showToast({ ...options, description, variant: 'warning' }),
  }), [dismissToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-24 z-[120] flex w-[min(100vw-2rem,24rem)] flex-col gap-3">
        {toasts.map((toast) => {
          const styles = FEEDBACK_TONES[toast.variant] || FEEDBACK_TONES.success

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-3xl border shadow-[0_22px_55px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-300 animate-[toast-in_220ms_ease-out] ${styles.surface}`}
              role="status"
              aria-live="polite"
            >
              <div className={`h-1.5 w-full ${styles.accent}`} />
              <div className="flex items-start gap-3 px-4 py-4">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
                  <span className="material-symbols-outlined text-[22px]">{styles.icon}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
                    <span>{styles.badge}</span>
                  </div>
                  {toast.title ? <strong className="mt-1 block text-sm font-black">{toast.title}</strong> : null}
                  <p className="mt-1 text-sm leading-relaxed">{toast.description}</p>
                </div>

                <Button type="button" variant="ghost" className={`min-h-0 rounded-2xl p-2 ${styles.button}`} onClick={() => dismissToast(toast.id)} aria-label="Fechar notificação">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider.')
  }

  return context
}

export default ToastContext
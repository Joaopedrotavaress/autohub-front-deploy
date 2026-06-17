import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button'
import { DIALOG_TONE_ALIAS, FEEDBACK_TONES } from '../components/ui/tokens'

const DEFAULT_MODAL = {
  isOpen: false,
  title: '',
  description: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  tone: 'default',
  isDestructive: false,
}

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState(DEFAULT_MODAL)
  const resolverRef = useRef(null)
  const confirmButtonRef = useRef(null)

  const closeModal = useCallback((result = false) => {
    if (resolverRef.current) {
      resolverRef.current(result)
      resolverRef.current = null
    }

    setModalState(DEFAULT_MODAL)
  }, [])

  const openModal = useCallback((options) => new Promise((resolve) => {
    resolverRef.current = resolve
    setModalState({
      ...DEFAULT_MODAL,
      ...options,
      isOpen: true,
    })
  }), [])

  useEffect(() => {
    if (!modalState.isOpen) {
      document.body.style.removeProperty('overflow')
      return undefined
    }

    document.body.style.setProperty('overflow', 'hidden')
    confirmButtonRef.current?.focus()

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeModal(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.removeProperty('overflow')
      window.removeEventListener('keydown', handleEscape)
    }
  }, [closeModal, modalState.isOpen])

  const value = useMemo(() => ({
    openModal,
    confirm: (options) => openModal({ ...options, tone: options?.tone || 'default' }),
    confirmWarning: (options) => openModal({ ...options, tone: 'warning' }),
    confirmDeletion: (options) => openModal({
      ...options,
      tone: 'danger',
      isDestructive: true,
      confirmLabel: options?.confirmLabel || 'Excluir',
    }),
    closeModal,
  }), [closeModal, openModal])

  const resolvedTone = DIALOG_TONE_ALIAS[modalState.tone] || modalState.tone || 'neutral'
  const styles = FEEDBACK_TONES[resolvedTone] || FEEDBACK_TONES.neutral

  return (
    <ModalContext.Provider value={value}>
      {children}

      {modalState.isOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/55 px-4 py-10 backdrop-blur-sm"
          role="presentation"
          onClick={() => closeModal(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.28)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-modal-title"
            aria-describedby="global-modal-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`px-6 py-6 sm:px-7 ${styles.dialogPanel}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] ${styles.dialogIconWrap}`}>
                  <span className="material-symbols-outlined text-[28px]">{styles.icon}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">{styles.badge}</span>
                  <h2 id="global-modal-title" className="mt-2 text-2xl font-black tracking-tight">
                    {modalState.title}
                  </h2>
                  <p id="global-modal-description" className="mt-3 text-sm leading-relaxed opacity-90">
                    {modalState.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
              <Button type="button" variant="secondary" onClick={() => closeModal(false)}>
                {modalState.cancelLabel}
              </Button>
              <Button
                ref={confirmButtonRef}
                type="button"
                className={styles.dialogPrimary}
                onClick={() => closeModal(true)}
              >
                {modalState.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)

  if (!context) {
    throw new Error('useModal deve ser usado dentro de ModalProvider.')
  }

  return context
}

export default ModalContext
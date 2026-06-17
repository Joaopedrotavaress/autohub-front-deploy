import { useEffect, useId } from 'react'
import { Button } from './Button'
import { cn } from './cn'

export function Dialog({
  isOpen,
  onClose,
  eyebrow,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  className,
}) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-zinc-950/55 px-4 py-10 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={cn('w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.28)]', maxWidth, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {(eyebrow || title || description) ? (
          <div className="border-b border-zinc-200 px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">{eyebrow}</p> : null}
                {title ? <h2 id={titleId} className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{title}</h2> : null}
                {description ? <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p> : null}
              </div>

              <Button aria-label="Fechar diálogo" className="shrink-0" size="sm" variant="secondary" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : null}

        <div className="px-6 py-6 sm:px-7">{children}</div>

        {footer ? <div className="border-t border-zinc-200 px-6 py-5 sm:px-7">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Dialog
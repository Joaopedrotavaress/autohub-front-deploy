import { cn } from './cn'
import { FEEDBACK_TONES } from './tokens'

export function Notice({ variant = 'neutral', title, description, className, children }) {
  const tone = FEEDBACK_TONES[variant] || FEEDBACK_TONES.neutral

  return (
    <div className={cn('rounded-2xl border px-4 py-4', tone.surface, className)}>
      {title ? <strong className="block text-sm font-black">{title}</strong> : null}
      {description ? <p className={cn('text-sm leading-relaxed', title && 'mt-1')}>{description}</p> : null}
      {children ? <div className={cn('text-sm leading-relaxed', (title || description) && 'mt-2')}>{children}</div> : null}
    </div>
  )
}

export default Notice
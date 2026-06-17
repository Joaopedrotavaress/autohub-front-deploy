import { cn } from './cn'
import { STATUS_BADGE_TONES } from './tokens'

export function StatusBadge({ tone = 'neutral', icon, className, children }) {
  return (
    <span className={cn('inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]', STATUS_BADGE_TONES[tone] || STATUS_BADGE_TONES.neutral, className)}>
      {icon ? <span className="material-symbols-outlined text-[16px]">{icon}</span> : null}
      <span>{children}</span>
    </span>
  )
}

export default StatusBadge
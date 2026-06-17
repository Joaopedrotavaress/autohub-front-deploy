import { cn } from './cn'

export function SectionHeader({ eyebrow, title, description, actions, className, align = 'left' }) {
  return (
    <header className={cn('grid gap-3', align === 'center' && 'justify-items-center text-center', className)}>
      {eyebrow ? (
        <span className="inline-flex items-center text-[11px] font-black uppercase tracking-[0.22em] text-red-700">
          {eyebrow}
        </span>
      ) : null}
      <div className={cn('flex flex-wrap items-end justify-between gap-4', align === 'center' && 'justify-center')}>
        <div className={cn(align === 'center' && 'max-w-3xl')}>
          {title ? <h1 className="text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">{title}</h1> : null}
          {description ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  )
}

export default SectionHeader
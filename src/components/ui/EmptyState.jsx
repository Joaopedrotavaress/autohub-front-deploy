import { cn } from './cn'

export function EmptyState({ title, description, actions, className, children }) {
  return (
    <div className={cn('grid min-h-48 place-items-center gap-3 rounded-[1.75rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center text-zinc-600', className)}>
      <div className="max-w-2xl">
        {title ? <h2 className="text-xl font-black text-zinc-950">{title}</h2> : null}
        {description ? <p className={cn('text-sm leading-relaxed', title && 'mt-2')}>{description}</p> : null}
        {children ? <div className={cn('text-sm leading-relaxed', (title || description) && 'mt-3')}>{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </div>
  )
}

export default EmptyState
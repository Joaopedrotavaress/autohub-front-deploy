import { Card } from './Card'
import { cn } from './cn'

export function PageStack({ className, maxWidth = 'max-w-7xl', ...props }) {
  return <div className={cn('mx-auto grid w-full gap-6', maxWidth, className)} {...props} />
}

export function SurfacePanel({ as: Component = 'section', className, padded = true, ...props }) {
  return <Card as={Component} className={cn(padded && 'p-5 md:p-6', className)} {...props} />
}

export function MetricCard({ eyebrow, title, description, className, children }) {
  return (
    <Card className={cn('rounded-[1.5rem] bg-zinc-50 p-5 shadow-none', className)}>
      {eyebrow ? <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</span> : null}
      {title ? <strong className="mt-2 block text-base font-black text-zinc-950">{title}</strong> : null}
      {description ? <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p> : null}
      {children}
    </Card>
  )
}

export function ActionBar({ className, ...props }) {
  return <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)} {...props} />
}

export default PageStack
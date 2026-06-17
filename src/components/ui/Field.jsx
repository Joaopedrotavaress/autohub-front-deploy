import { cn } from './cn'

const labelClassName = 'mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500'
const controlClassName = 'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60'

export function Field({ label, htmlFor, className, hint, children }) {
  return (
    <div className={className}>
      {label ? <label className={labelClassName} htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {hint ? <p className="mt-2 text-sm text-zinc-500">{hint}</p> : null}
    </div>
  )
}

export function Input({ className, readOnly = false, ...props }) {
  return (
    <input
      className={cn(controlClassName, readOnly && 'bg-zinc-100 text-zinc-600', className)}
      readOnly={readOnly}
      {...props}
    />
  )
}

export function Select({ className, ...props }) {
  return <select className={cn(controlClassName, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(controlClassName, 'min-h-[110px] resize-y', className)} {...props} />
}

export default Field
import { cn } from './cn'

const VARIANT_CLASSES = {
  primary: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/20 hover:from-red-700 hover:to-red-600',
  secondary: 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
  subtle: 'bg-zinc-900 text-white hover:bg-zinc-800',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const SIZE_CLASSES = {
  sm: 'min-h-10 px-4 py-2.5 text-sm',
  md: 'min-h-11 px-5 py-3 text-sm',
  lg: 'min-h-12 px-6 py-3.5 text-sm',
}

export function getButtonClasses({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    fullWidth && 'w-full',
    className,
  )
}

export function Button({ type = 'button', variant = 'primary', size = 'md', fullWidth = false, className, ...props }) {
  return <button type={type} className={getButtonClasses({ variant, size, fullWidth, className })} {...props} />
}

export default Button
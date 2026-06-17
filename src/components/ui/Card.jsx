import { cn } from './cn'

export function Card({ as: Component = 'div', className, ...props }) {
  return (
    <Component
      className={cn('rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(25,28,29,0.06)]', className)}
      {...props}
    />
  )
}

export default Card
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5',
        glow && 'shadow-[0_0_30px_rgba(245,197,24,0.08)]',
        className
      )}
    >
      {children}
    </div>
  )
}

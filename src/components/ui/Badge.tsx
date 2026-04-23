import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'gold' | 'blue' | 'green' | 'red' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'gold' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        variant === 'blue' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        variant === 'green' && 'bg-green-500/20 text-green-400 border border-green-500/30',
        variant === 'red' && 'bg-red-500/20 text-red-400 border border-red-500/30',
        variant === 'gray' && 'bg-white/10 text-white/60 border border-white/20',
        className
      )}
    >
      {children}
    </span>
  )
}

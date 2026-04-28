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
        variant === 'gold' && 'bg-violet-50 text-violet-700 border border-violet-200',
        variant === 'blue' && 'bg-blue-50 text-blue-700 border border-blue-200',
        variant === 'green' && 'bg-green-50 text-green-700 border border-green-200',
        variant === 'red' && 'bg-red-50 text-red-600 border border-red-200',
        variant === 'gray' && 'bg-gray-100 text-gray-600 border border-gray-200',
        className
      )}
    >
      {children}
    </span>
  )
}

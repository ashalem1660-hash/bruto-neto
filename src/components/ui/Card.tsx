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
        'rounded-2xl border border-gray-200 bg-white shadow-sm p-5',
        glow && 'shadow-[0_0_30px_rgba(124,58,237,0.08)]',
        className
      )}
    >
      {children}
    </div>
  )
}

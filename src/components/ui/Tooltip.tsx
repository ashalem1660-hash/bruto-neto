'use client'

import { useState, type ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: ReactNode
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <span
        className="cursor-help text-gray-400 hover:text-violet-600 transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        {children ?? <HelpCircle className="w-4 h-4" />}
      </span>
      {open && (
        <span className="absolute bottom-full mb-2 right-0 z-50 w-64 rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-700 shadow-xl leading-relaxed">
          {content}
        </span>
      )}
    </span>
  )
}

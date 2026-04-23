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
        className="cursor-help text-white/40 hover:text-amber-400 transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        {children ?? <HelpCircle className="w-4 h-4" />}
      </span>
      {open && (
        <span className="absolute bottom-full mb-2 right-0 z-50 w-64 rounded-xl bg-[#1a1a2e] border border-white/20 p-3 text-xs text-white/80 shadow-xl leading-relaxed">
          {content}
        </span>
      )}
    </span>
  )
}

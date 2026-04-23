'use client'

import type { CalculatorResult } from '@/lib/types'

interface Props {
  result: CalculatorResult
}

export function NetSalaryBar({ result }: Props) {
  const gross = result.grossMonthly
  if (gross <= 0) return null

  const segments = [
    { label: 'נטו', value: Math.max(0, result.netMonthly), color: '#10b981' },
    { label: 'מ"ה', value: Math.max(0, result.deductions.incomeTax.monthly), color: '#F5C518' },
    { label: 'ב"ל', value: Math.max(0, result.deductions.bituachLeumi.monthly), color: '#3b82f6' },
    { label: 'בריאות', value: Math.max(0, result.deductions.bituachBriut.monthly), color: '#8b5cf6' },
    { label: 'פנסיה', value: Math.max(0, result.deductions.pension.monthly), color: '#ef4444' }
  ]

  return (
    <div className="space-y-2">
      <div className="flex h-8 rounded-full overflow-hidden gap-0.5">
        {segments.filter(s => s.value > 0).map(seg => (
          <div
            key={seg.label}
            style={{
              width: `${(seg.value / gross) * 100}%`,
              backgroundColor: seg.color
            }}
            className="transition-all duration-500 first:rounded-r-full last:rounded-l-full"
            title={`${seg.label}: ₪${Math.round(seg.value).toLocaleString('he-IL')}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {segments.filter(s => s.value > 0).map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  )
}

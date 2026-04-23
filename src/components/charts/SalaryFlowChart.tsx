'use client'

import type { CalculatorResult } from '@/lib/types'

interface Props {
  result: CalculatorResult
}

interface FlowItem {
  label: string
  value: number
  pct: number
  color: string
  subItems?: { label: string; value: number; color: string }[]
}

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

export function SalaryFlowChart({ result }: Props) {
  const gross = result.grossMonthly
  if (gross <= 0) return null

  const ec = result.employerCost
  const sf = result.studyFund

  const employeeItems: FlowItem[] = [
    {
      label: 'נטו לבנק',
      value: Math.max(0, result.netMonthly),
      pct: Math.max(0, result.netPercent),
      color: '#10b981',
      subItems: []
    },
    {
      label: 'מסים',
      value: result.deductions.incomeTax.monthly + result.deductions.bituachLeumi.monthly + result.deductions.bituachBriut.monthly,
      pct: ((result.deductions.incomeTax.monthly + result.deductions.bituachLeumi.monthly + result.deductions.bituachBriut.monthly) / gross) * 100,
      color: '#ef4444',
      subItems: [
        { label: 'מס הכנסה', value: result.deductions.incomeTax.monthly, color: '#fca5a5' },
        { label: 'ביטוח לאומי', value: result.deductions.bituachLeumi.monthly, color: '#f87171' },
        { label: 'ביטוח בריאות', value: result.deductions.bituachBriut.monthly, color: '#fecaca' }
      ]
    },
    {
      label: 'פנסיה עובד',
      value: result.deductions.pension.monthly,
      pct: (result.deductions.pension.monthly / gross) * 100,
      color: '#f59e0b'
    },
    ...(result.deductions.studyFundEmployee ? [{
      label: 'השתלמות עובד',
      value: result.deductions.studyFundEmployee.monthly,
      pct: (result.deductions.studyFundEmployee.monthly / gross) * 100,
      color: '#8b5cf6'
    }] : [])
  ]

  const employerItems: FlowItem[] = ec ? [
    {
      label: 'פנסיה+פיצויים',
      value: ec.pensionEmployer + ec.severancePay,
      pct: ((ec.pensionEmployer + ec.severancePay) / gross) * 100,
      color: '#f59e0b'
    },
    ...(ec.studyFundEmployer > 0 ? [{
      label: 'השתלמות מעסיק',
      value: ec.studyFundEmployer,
      pct: (ec.studyFundEmployer / gross) * 100,
      color: '#8b5cf6'
    }] : []),
    {
      label: 'ב.לאומי מעסיק',
      value: ec.bituachLeumiEmployer,
      pct: (ec.bituachLeumiEmployer / gross) * 100,
      color: '#6366f1'
    }
  ] : []

  return (
    <div className="space-y-5">
      {/* Employee side — gross breakdown */}
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>שכר ברוטו</span>
          <span className="font-medium text-white/60">{fmt(gross)}</span>
        </div>

        {/* Stacked bar */}
        <div className="flex h-10 rounded-xl overflow-hidden gap-0.5 mb-3">
          {employeeItems.filter(i => i.value > 0).map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.pct}%`, backgroundColor: item.color }}
              className="transition-all duration-500 relative group"
              title={`${item.label}: ${fmt(item.value)}`}
            >
              {item.pct > 8 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80 select-none">
                  {Math.round(item.pct)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-1.5">
          {employeeItems.filter(i => i.value > 0).map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-white/70">{item.label}</span>
                </div>
                <div className="text-left">
                  <span className="text-white/80 font-medium">{fmt(item.value)}</span>
                  <span className="text-white/30 text-xs mr-1">({Math.round(item.pct)}%)</span>
                </div>
              </div>
              {item.subItems && item.subItems.length > 0 && (
                <div className="mr-5 mt-1 space-y-0.5">
                  {item.subItems.filter(s => s.value > 0).map((sub, si) => (
                    <div key={si} className="flex justify-between text-xs text-white/40">
                      <span>{sub.label}</span>
                      <span>{fmt(sub.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Employer additions */}
      {ec && employerItems.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <div className="text-xs text-white/40 mb-3">+ תוספות מהמעסיק (מעבר לברוטו)</div>
          <div className="space-y-1.5">
            {employerItems.filter(i => i.value > 0).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0 opacity-70" style={{ backgroundColor: item.color }} />
                  <span className="text-white/50">{item.label}</span>
                </div>
                <span className="text-white/60 font-medium">{fmt(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm font-bold">
            <span className="text-white/60">עלות כוללת למעסיק</span>
            <span className="text-blue-300">{fmt(ec.totalEmployerCost)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

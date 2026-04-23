'use client'

import type { CalculatorInput } from '@/lib/types'
import { Tooltip } from '@/components/ui/Tooltip'

interface Props {
  input: CalculatorInput
  onChange: (updates: Partial<CalculatorInput>) => void
}

export function SelfEmployedForm({ input, onChange }: Props) {
  const netIncome = input.annualRevenue - input.annualExpenses

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-white/60">מחזור שנתי (הכנסות)</label>
          <Tooltip content="סך כל ההכנסות מהעסק לפני כל ניכוי" />
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₪</span>
          <input
            type="number"
            value={input.annualRevenue}
            onChange={e => onChange({ annualRevenue: Number(e.target.value) || 0 })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-10 text-white font-bold focus:outline-none focus:border-amber-500 transition-colors text-right"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-white/60">הוצאות מוכרות שנתיות</label>
          <Tooltip content="הוצאות שמותר לנכות מההכנסה לצרכי מס: שכר דירה, רכב, ציוד, פרסום, חשבונאות ועוד." />
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₪</span>
          <input
            type="number"
            value={input.annualExpenses}
            onChange={e => onChange({ annualExpenses: Number(e.target.value) || 0 })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-10 text-white font-bold focus:outline-none focus:border-amber-500 transition-colors text-right"
            dir="ltr"
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">רווח נקי מהעסק</span>
          <span className="text-amber-400 font-bold">
            ₪{netIncome.toLocaleString('he-IL')} לשנה
          </span>
        </div>
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>= הבסיס לחישוב המסים</span>
          <span>≈ ₪{Math.round(netIncome / 12).toLocaleString('he-IL')} לחודש</span>
        </div>
      </div>
    </div>
  )
}

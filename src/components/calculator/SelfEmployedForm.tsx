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
          <label className="text-sm text-gray-600">מחזור שנתי (הכנסות)</label>
          <Tooltip content="סך כל ההכנסות מהעסק לפני כל ניכוי" />
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-600 font-bold">₪</span>
          <input
            type="number"
            value={input.annualRevenue}
            onChange={e => onChange({ annualRevenue: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 font-bold focus:outline-none focus:border-violet-500 transition-colors text-right"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm text-gray-600">הוצאות מוכרות שנתיות</label>
          <Tooltip content="הוצאות שמותר לנכות מההכנסה לצרכי מס: שכר דירה, רכב, ציוד, פרסום, חשבונאות ועוד." />
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">₪</span>
          <input
            type="number"
            value={input.annualExpenses}
            onChange={e => onChange({ annualExpenses: Number(e.target.value) || 0 })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 font-bold focus:outline-none focus:border-violet-500 transition-colors text-right"
            dir="ltr"
          />
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">רווח נקי מהעסק</span>
          <span className="text-green-600 font-bold">
            ₪{netIncome.toLocaleString('he-IL')} לשנה
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>= הבסיס לחישוב המסים</span>
          <span>≈ ₪{Math.round(netIncome / 12).toLocaleString('he-IL')} לחודש</span>
        </div>
      </div>
    </div>
  )
}

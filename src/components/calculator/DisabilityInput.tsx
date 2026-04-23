'use client'

import { Toggle } from '@/components/ui/Toggle'
import { Slider } from '@/components/ui/Slider'
import { Tooltip } from '@/components/ui/Tooltip'
import type { CalculatorInput } from '@/lib/types'

interface Props {
  disability: CalculatorInput['disability']
  onChange: (d: CalculatorInput['disability']) => void
}

export function DisabilityInput({ disability, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">נכות אישית</span>
          <Tooltip content="נכות בשיעור 50%+ מזכה בנקודת זיכוי אחת. נכות 90%+ או עיוורון מזכים ב-2 נקודות זיכוי." />
        </div>
        <Toggle
          checked={disability.hasDisability}
          onChange={v => onChange({ ...disability, hasDisability: v })}
        />
      </div>

      {disability.hasDisability && (
        <div className="space-y-3 bg-white/5 rounded-xl p-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">אחוז נכות</span>
              <span className="text-amber-400 font-bold">{disability.percentage}%</span>
            </div>
            <Slider
              value={disability.percentage}
              min={0}
              max={100}
              step={10}
              onChange={v => onChange({ ...disability, percentage: v })}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={disability.isBlind}
              onChange={e => onChange({ ...disability, isBlind: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500"
            />
            <span className="text-sm text-white/60">עיוורון</span>
          </label>
          <div className="text-xs text-white/40">
            {disability.isBlind || disability.percentage >= 100
              ? '→ 2 נקודות זיכוי'
              : disability.percentage >= 90
              ? '→ 2 נקודות זיכוי'
              : disability.percentage >= 50
              ? '→ 1 נקודת זיכוי'
              : '→ אין זכאות (נדרש 50%+)'}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { clsx } from 'clsx'
import type { CalculatorInput } from '@/lib/types'

interface Props {
  input: CalculatorInput
  onChange: (updates: Partial<CalculatorInput>) => void
}

const MARITAL_OPTIONS = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' }
]

export function PersonalDetailsForm({ input, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-2">מגדר</label>
          <div className="grid grid-cols-2 gap-2">
            {(['male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => onChange({ gender: g })}
                className={clsx(
                  'py-2 rounded-xl text-sm font-medium border transition-all',
                  input.gender === g
                    ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                    : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'
                )}
              >
                {g === 'male' ? '👨 גבר' : '👩 אישה'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">גיל</label>
          <input
            type="number"
            value={input.age}
            min={18}
            max={100}
            onChange={e => onChange({ age: Number(e.target.value) })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-center"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">מצב משפחתי</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MARITAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ maritalStatus: opt.value as CalculatorInput['maritalStatus'] })}
              className={clsx(
                'py-2 rounded-xl text-xs font-medium border transition-all',
                input.maritalStatus === opt.value
                  ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                  : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

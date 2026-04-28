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
          <label className="block text-sm text-gray-600 mb-2">מגדר</label>
          <div className="grid grid-cols-2 gap-2">
            {(['male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={() => onChange({ gender: g })}
                className={clsx(
                  'py-2 rounded-xl text-sm font-medium border transition-all',
                  input.gender === g
                    ? 'border-violet-500 bg-violet-50 text-violet-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                {g === 'male' ? '👨 גבר' : '👩 אישה'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">גיל</label>
          <input
            type="number"
            value={input.age}
            min={18}
            max={100}
            onChange={e => onChange({ age: Number(e.target.value) })}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-violet-500 transition-colors text-center"
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">מצב משפחתי</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MARITAL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onChange({ maritalStatus: opt.value as CalculatorInput['maritalStatus'] })}
              className={clsx(
                'py-2 rounded-xl text-xs font-medium border transition-all',
                input.maritalStatus === opt.value
                  ? 'border-violet-500 bg-violet-50 text-violet-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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

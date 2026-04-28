'use client'

import { Slider } from '@/components/ui/Slider'

interface Props {
  value: number
  onChange: (v: number) => void
}

const fmt = (v: number) => `₪${v.toLocaleString('he-IL')}`

export function SalaryInput({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-2">שכר ברוטו חודשי</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-600 font-bold">₪</span>
            <input
              type="number"
              value={value}
              onChange={e => onChange(Math.max(0, Math.min(200000, Number(e.target.value) || 0)))}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 text-lg font-bold focus:outline-none focus:border-violet-500 transition-colors text-right"
              placeholder="0"
              dir="ltr"
            />
          </div>
        </div>
      </div>
      <Slider
        value={value}
        min={0}
        max={100000}
        step={500}
        onChange={onChange}
        className="px-1"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>₪100,000</span>
        <span>₪0</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[8000, 12000, 20000, 35000].map(preset => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className="py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-all"
          >
            {fmt(preset)}
          </button>
        ))}
      </div>
    </div>
  )
}

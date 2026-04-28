'use client'

import { clsx } from 'clsx'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  className?: string
  showValue?: boolean
  formatValue?: (v: number) => string
}

export function Slider({ value, min, max, step = 1, onChange, className, showValue, formatValue }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={clsx('relative', className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to left, #E5E7EB ${100 - pct}%, #7C3AED ${100 - pct}%)`
        }}
      />
      {showValue && (
        <div className="text-center mt-2 text-violet-600 font-bold text-lg">
          {formatValue ? formatValue(value) : value}
        </div>
      )}
    </div>
  )
}

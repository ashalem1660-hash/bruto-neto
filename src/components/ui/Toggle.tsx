'use client'

import { clsx } from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={clsx('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <div
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-amber-500' : 'bg-white/20'
        )}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className={clsx(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5 right-0.5' : 'translate-x-0 left-0.5'
          )}
        />
      </div>
      {label && <span className="text-sm text-white/80">{label}</span>}
    </label>
  )
}

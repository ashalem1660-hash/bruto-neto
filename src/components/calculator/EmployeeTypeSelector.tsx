'use client'

import { clsx } from 'clsx'

interface Props {
  value: 'employee' | 'self_employed'
  onChange: (v: 'employee' | 'self_employed') => void
}

export function EmployeeTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {(['employee', 'self_employed'] as const).map(type => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={clsx(
            'relative flex flex-col items-center justify-center gap-2 p-4 sm:p-6 rounded-2xl border-2 transition-all duration-200 group',
            value === type
              ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_30px_rgba(245,197,24,0.2)]'
              : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
          )}
        >
          <span className="text-3xl sm:text-4xl">{type === 'employee' ? '👔' : '💼'}</span>
          <span className={clsx('text-base sm:text-xl font-bold', value === type ? 'text-amber-400' : 'text-white')}>
            {type === 'employee' ? 'שכיר' : 'עצמאי'}
          </span>
          <span className="text-xs text-white/50 text-center">
            {type === 'employee'
              ? 'עובד במקום עבודה, מקבל תלוש משכורת'
              : 'עוסק מורשה, פרילנסר, בעל עסק'}
          </span>
          {value === type && (
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,197,24,0.8)]" />
          )}
        </button>
      ))}
    </div>
  )
}

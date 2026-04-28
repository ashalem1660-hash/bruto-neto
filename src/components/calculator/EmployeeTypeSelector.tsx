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
              ? 'border-violet-500 bg-violet-50 shadow-[0_0_20px_rgba(124,58,237,0.12)]'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <span className="text-3xl sm:text-4xl">{type === 'employee' ? '👔' : '💼'}</span>
          <span className={clsx('text-base sm:text-xl font-bold', value === type ? 'text-violet-600' : 'text-gray-900')}>
            {type === 'employee' ? 'שכיר' : 'עצמאי'}
          </span>
          <span className="text-xs text-gray-500 text-center">
            {type === 'employee'
              ? 'עובד במקום עבודה, מקבל תלוש משכורת'
              : 'עוסק מורשה, פרילנסר, בעל עסק'}
          </span>
          {value === type && (
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
          )}
        </button>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Settlement, CalculatorInput } from '@/lib/types'
import { clsx } from 'clsx'

interface Props {
  settlement: CalculatorInput['settlement']
  settlements: Settlement[]
  onChange: (s: CalculatorInput['settlement']) => void
}

export function SettlementSelect({ settlement, settlements, onChange }: Props) {
  const [search, setSearch] = useState('')

  const filtered = settlements.filter(s =>
    s.name.includes(search)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">יישוב מזכה</span>
          <Tooltip content="תושבי יישובים מזכים זכאים להנחה על מס הכנסה: קטגוריה A — 20% הנחה, קטגוריה B — 10% הנחה, על הכנסה עד ₪199,000 בשנה." />
        </div>
        <Toggle
          checked={settlement.isRecognized}
          onChange={v => onChange({ ...settlement, isRecognized: v, category: v ? settlement.category : null, name: v ? settlement.name : '' })}
        />
      </div>

      {settlement.isRecognized && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="חפש יישוב..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
          <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-gray-200 bg-white p-2">
            {filtered.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-2">לא נמצאו יישובים</p>
            ) : (
              filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onChange({ isRecognized: true, category: s.category, name: s.name })
                    setSearch(s.name)
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                    settlement.name === s.name
                      ? 'bg-violet-50 text-violet-600 border border-violet-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <span>{s.name}</span>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full border',
                    s.category === 'A'
                      ? 'text-violet-600 border-violet-200 bg-violet-50'
                      : 'text-blue-600 border-blue-200 bg-blue-50'
                  )}>
                    {s.category} — {s.category === 'A' ? '20%' : '10%'}
                  </span>
                </button>
              ))
            )}
          </div>
          {settlement.name && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              ✓ נבחר: {settlement.name} — הנחה {settlement.category === 'A' ? '20%' : '10%'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

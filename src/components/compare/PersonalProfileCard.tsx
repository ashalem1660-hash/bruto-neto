'use client'

import { clsx } from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { PersonalProfile } from '@/lib/compare-types'
import { Tooltip } from '@/components/ui/Tooltip'

interface Props {
  profile: PersonalProfile
  onChange: (updates: Partial<PersonalProfile>) => void
}

export function PersonalProfileCard({ profile, onChange }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-2xl border border-violet-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-violet-50 hover:bg-violet-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">👤</span>
          <div className="text-right">
            <div className="text-sm font-bold text-violet-700">פרופיל אישי</div>
            <div className="text-xs text-violet-500">משפיע על חישוב נקודות הזיכוי ושיעור המס</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
      </button>

      {open && (
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* מגדר */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">מגדר</label>
              <div className="grid grid-cols-2 gap-1">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => onChange({ gender: g })}
                    className={clsx(
                      'py-2 rounded-lg text-xs font-medium border transition-all',
                      profile.gender === g
                        ? 'border-violet-500 bg-violet-50 text-violet-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {g === 'male' ? '👨' : '👩'}
                  </button>
                ))}
              </div>
            </div>

            {/* גיל */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">גיל</label>
              <input
                type="number"
                value={profile.age}
                min={18} max={70}
                onChange={e => onChange({ age: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                dir="ltr"
              />
            </div>

            {/* מצב משפחתי */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">מצב משפחתי</label>
              <select
                value={profile.maritalStatus}
                onChange={e => onChange({ maritalStatus: e.target.value as PersonalProfile['maritalStatus'] })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="single">רווק/ה</option>
                <option value="married">נשוי/אה</option>
                <option value="divorced">גרוש/ה</option>
                <option value="widowed">אלמן/ה</option>
              </select>
            </div>

            {/* ילדים */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="text-xs text-gray-500 font-medium">מספר ילדים</label>
                <Tooltip content="מניחים ילדים בגיל 6–17 (נקודת זיכוי אחת כל אחד). לחישוב מדויק יותר, השתמש במחשבון הראשי" />
              </div>
              <input
                type="number"
                value={profile.childrenCount}
                min={0} max={10}
                onChange={e => onChange({ childrenCount: Number(e.target.value) })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                dir="ltr"
              />
            </div>

            {/* הורה יחיד */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">הורה יחיד</label>
              <div className="grid grid-cols-2 gap-1">
                {[false, true].map(v => (
                  <button
                    key={String(v)}
                    onClick={() => onChange({ isSingleParent: v })}
                    className={clsx(
                      'py-2 rounded-lg text-xs font-medium border transition-all',
                      profile.isSingleParent === v
                        ? 'border-violet-500 bg-violet-50 text-violet-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {v ? 'כן' : 'לא'}
                  </button>
                ))}
              </div>
            </div>

            {/* נקודות זיכוי ידני */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="text-xs text-gray-500 font-medium">נקודות זיכוי</label>
                <Tooltip content="השאר ריק לחישוב אוטומטי, או הכנס מהמחשבון הראשי לדיוק מרבי" />
              </div>
              <input
                type="number"
                value={profile.creditPointsOverride ?? ''}
                placeholder="אוטומטי"
                min={0}
                step={0.25}
                onChange={e => onChange({
                  creditPointsOverride: e.target.value === '' ? null : Number(e.target.value)
                })}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                dir="ltr"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

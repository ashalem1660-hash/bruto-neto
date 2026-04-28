'use client'

import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import type { CalculatorInput } from '@/lib/types'

interface Props {
  input: CalculatorInput
  onChange: (updates: Partial<CalculatorInput>) => void
}

const CURRENT_YEAR = new Date().getFullYear()

export function AdditionalOptions({ input, onChange }: Props) {
  const bachelorYearsSince = CURRENT_YEAR - input.bachelorGraduationYear
  const bachelorEligible = input.hasBachelors && input.bachelorGraduationYear >= 2023 && bachelorYearsSince >= 1 && bachelorYearsSince <= 3

  const masterYearsSince = CURRENT_YEAR - input.masterGraduationYear
  const masterEligible = input.hasMasters && input.masterGraduationYear >= 2005 && masterYearsSince >= 1

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">הורה יחיד</span>
          <Tooltip content="הורה יחיד שיש לו ילדים זכאי לנקודת זיכוי נוספת." />
        </div>
        <Toggle checked={input.isSingleParent} onChange={v => onChange({ isSingleParent: v })} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">משלם מזונות</span>
          <Tooltip content="מי שמשלם מזונות על פי פסק דין זכאי לנקודת זיכוי אחת נוספת." />
        </div>
        <Toggle checked={input.paysMaintenance} onChange={v => onChange({ paysMaintenance: v })} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">עולה חדש</span>
          <Tooltip content="עולה חדש זכאי ל-3 נקודות זיכוי בשנים הראשונות לעלייה." />
        </div>
        <Toggle checked={input.isNewImmigrant} onChange={v => onChange({ isNewImmigrant: v })} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">בן/ת זוג לא עובד/ת</span>
          <Tooltip content="בתנאים מסוימים (נכות, גיל פרישה) ניתנת נקודת זיכוי נוספת בגין בן/ת זוג שאינו עובד." />
        </div>
        <Toggle checked={input.spouseNotWorking} onChange={v => onChange({ spouseNotWorking: v })} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">חייל/ת משוחרר/ת</span>
          <Tooltip content="מי שסיים שירות חובה מלא בצבא זכאי לנקודת זיכוי אחת נוספת (בשנת השחרור ואחריה)." />
        </div>
        <Toggle checked={input.isVeteran} onChange={v => onChange({ isVeteran: v })} />
      </div>

      {/* תואר ראשון */}
      <div className="space-y-2 border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">תואר ראשון</span>
            <Tooltip content="בוגרי תואר ראשון משנת 2023 ואילך זכאים לנקודת זיכוי אחת לשנה, עד 3 שנות מס לאחר שנת הסיום." />
          </div>
          <Toggle checked={input.hasBachelors} onChange={v => onChange({ hasBachelors: v })} />
        </div>
        {input.hasBachelors && (
          <div className="pr-4 space-y-1.5">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 w-28">שנת סיום לימודים</label>
              <input
                type="number"
                value={input.bachelorGraduationYear}
                min={2020} max={CURRENT_YEAR}
                onChange={e => onChange({ bachelorGraduationYear: Number(e.target.value) })}
                className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
              />
            </div>
            {bachelorEligible
              ? <div className="text-xs text-green-600">✓ זכאי — שנה {bachelorYearsSince} מתוך 3 (1 נק׳)</div>
              : input.bachelorGraduationYear < 2023
                ? <div className="text-xs text-gray-400">✗ הזכאות חלה רק על בוגרי 2023 ואילך</div>
                : bachelorYearsSince < 1
                  ? <div className="text-xs text-gray-400">✗ הזכאות מתחילה בשנת המס שאחרי הסיום</div>
                  : <div className="text-xs text-gray-400">✗ חלפו יותר מ-3 שנים מהסיום</div>
            }
          </div>
        )}
      </div>

      {/* תואר שני */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">תואר שני</span>
            <Tooltip content="בוגרי תואר שני בישראל משנת 2005 ואילך זכאים לחצי נקודת זיכוי לשנה." />
          </div>
          <Toggle checked={input.hasMasters} onChange={v => onChange({ hasMasters: v })} />
        </div>
        {input.hasMasters && (
          <div className="pr-4 space-y-1.5">
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 w-28">שנת סיום לימודים</label>
              <input
                type="number"
                value={input.masterGraduationYear}
                min={2005} max={CURRENT_YEAR}
                onChange={e => onChange({ masterGraduationYear: Number(e.target.value) })}
                className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
              />
            </div>
            {masterEligible
              ? <div className="text-xs text-green-600">✓ זכאי (0.5 נק׳ לשנה)</div>
              : input.masterGraduationYear < 2005
                ? <div className="text-xs text-gray-400">✗ הזכאות חלה רק על בוגרי 2005 ואילך</div>
                : <div className="text-xs text-gray-400">✗ הזכאות מתחילה בשנת המס שאחרי הסיום</div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

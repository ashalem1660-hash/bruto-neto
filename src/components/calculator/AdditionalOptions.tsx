'use client'

import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import type { CalculatorInput } from '@/lib/types'

interface Props {
  input: CalculatorInput
  onChange: (updates: Partial<CalculatorInput>) => void
}

export function AdditionalOptions({ input, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">הורה יחיד</span>
          <Tooltip content="הורה יחיד שיש לו ילדים זכאי לנקודת זיכוי נוספת." />
        </div>
        <Toggle
          checked={input.isSingleParent}
          onChange={v => onChange({ isSingleParent: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">משלם מזונות</span>
          <Tooltip content="מי שמשלם מזונות על פי פסק דין זכאי לנקודת זיכוי אחת נוספת." />
        </div>
        <Toggle
          checked={input.paysMaintenance}
          onChange={v => onChange({ paysMaintenance: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">עולה חדש</span>
          <Tooltip content="עולה חדש זכאי ל-3 נקודות זיכוי בשנים הראשונות לעלייה." />
        </div>
        <Toggle
          checked={input.isNewImmigrant}
          onChange={v => onChange({ isNewImmigrant: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">בן/ת זוג לא עובד/ת</span>
          <Tooltip content="בתנאים מסוימים (נכות, גיל פרישה) ניתנת נקודת זיכוי נוספת בגין בן/ת זוג שאינו עובד." />
        </div>
        <Toggle
          checked={input.spouseNotWorking}
          onChange={v => onChange({ spouseNotWorking: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">חייל/ת משוחרר/ת</span>
          <Tooltip content="מי שסיים שירות חובה מלא בצבא זכאי לנקודת זיכוי אחת נוספת (בשנת השחרור ואחריה)." />
        </div>
        <Toggle
          checked={input.isVeteran}
          onChange={v => onChange({ isVeteran: v })}
        />
      </div>
    </div>
  )
}

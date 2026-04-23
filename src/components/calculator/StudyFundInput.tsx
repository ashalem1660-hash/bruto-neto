'use client'

import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import type { CalculatorInput } from '@/lib/types'
import { clsx } from 'clsx'

interface Props {
  input: CalculatorInput
  onChange: (updates: Partial<CalculatorInput>) => void
}

export function StudyFundInput({ input, onChange }: Props) {
  const isSelf = input.employeeType === 'self_employed'
  const hasIt = isSelf ? input.hasStudyFundSelf : input.hasStudyFund

  const monthlyGross = isSelf
    ? (input.annualRevenue - input.annualExpenses) / 12
    : input.grossIncome

  const employeeContrib = !isSelf && hasIt
    ? monthlyGross * (input.studyFundEmployeeRate / 100)
    : 0
  const employerContrib = !isSelf && hasIt
    ? Math.min(monthlyGross, 15712) * (input.studyFundEmployerRate / 100)
    : 0
  const selfContrib = isSelf && hasIt
    ? Math.min(input.annualRevenue - input.annualExpenses, 293397) * 0.045 / 12
    : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">קרן השתלמות</span>
          <Tooltip content={
            isSelf
              ? 'עצמאי יכול להפריש עד 4.5% מהכנסתו לקרן השתלמות — פטורה ממס רווחי הון ומוכרת כהוצאה! ניתן למשוך לאחר 6 שנים.'
              : 'קרן השתלמות: מעסיק מפריש 7.5% ועובד 2.5% מהשכר. ההפרשות פטורות ממס עד תקרת שכר של ₪15,712. ניתן למשוך לאחר 6 שנים — פטור ממס רווחי הון!'
          } />
        </div>
        <Toggle
          checked={hasIt}
          onChange={v => onChange(isSelf ? { hasStudyFundSelf: v } : { hasStudyFund: v })}
        />
      </div>

      {hasIt && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          {!isSelf && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 block mb-1">מעסיק %</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={input.studyFundEmployerRate}
                      min={0}
                      max={15}
                      step={0.5}
                      onChange={e => onChange({ studyFundEmployerRate: Number(e.target.value) })}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 text-center"
                      dir="ltr"
                    />
                    <span className="text-white/40 text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">עובד %</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={input.studyFundEmployeeRate}
                      min={0}
                      max={10}
                      step={0.5}
                      onChange={e => onChange({ studyFundEmployeeRate: Number(e.target.value) })}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 text-center"
                      dir="ltr"
                    />
                    <span className="text-white/40 text-xs">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <ContribBadge label="מעסיק" value={employerContrib} color="blue" />
                <ContribBadge label="עובד" value={employeeContrib} color="amber" note="מנוכה מנטו" />
                <ContribBadge label="סה״כ/חודש" value={employerContrib + employeeContrib} color="green" />
              </div>

              {monthlyGross > 15712 && (
                <div className="text-xs text-amber-400/70 flex items-start gap-1.5 mt-1">
                  <span>⚠️</span>
                  <span>שכרך מעל תקרת ₪15,712 — הפרשת מעסיק על החלק שמעבר ממוסית</span>
                </div>
              )}
            </>
          )}

          {isSelf && (
            <div className="space-y-2">
              <ContribBadge label="הפרשה חודשית (4.5%)" value={selfContrib} color="green" />
              <ContribBadge label="צבירה שנתית" value={selfContrib * 12} color="blue" />
              <div className="text-xs text-green-400/70 mt-1">
                ✓ מוכרת כהוצאה + פטורה ממס רווחי הון (25% חיסכון על הרווחים!)
              </div>
            </div>
          )}
        </div>
      )}

      {!hasIt && (
        <div className="text-xs text-white/30 border border-white/5 rounded-xl p-3 bg-white/[0.02]">
          {isSelf
            ? '💡 עצמאי ללא קרן השתלמות מפסיד הטבת מס גדולה — שקול לפתוח!'
            : '💡 בקש מהמעסיק — רוב המעסיקים מציעים קרן השתלמות כחלק מהחבילה'}
        </div>
      )}
    </div>
  )
}

function ContribBadge({ label, value, color, note }: {
  label: string; value: number; color: 'blue' | 'amber' | 'green'; note?: string
}) {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    green: 'border-green-500/30 bg-green-500/10 text-green-300'
  }
  return (
    <div className={clsx('rounded-lg border p-2 text-center', colors[color])}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="font-bold text-sm">₪{Math.round(value).toLocaleString('he-IL')}</div>
      {note && <div className="text-xs opacity-50">{note}</div>}
    </div>
  )
}

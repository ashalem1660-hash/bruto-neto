'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import type { JobOffer, OfferColor } from '@/lib/compare-types'
import { OFFER_COLORS } from '@/lib/compare-types'
import { Tooltip } from '@/components/ui/Tooltip'
import { Toggle } from '@/components/ui/Toggle'

interface Props {
  offer: JobOffer
  onChange: (updates: Partial<JobOffer>) => void
  onRemove: () => void
  canRemove: boolean
}

const COLORS: OfferColor[] = ['violet', 'green', 'blue', 'orange']

function Section({ title, icon, children, defaultOpen = false }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  )
}

function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs text-gray-500 font-medium">{label}</label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {children}
    </div>
  )
}

function NumInput({ value, onChange, suffix, placeholder }: {
  value: number; onChange: (v: number) => void; suffix?: string; placeholder?: string
}) {
  return (
    <div className="relative">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₪</span>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder ?? '0'}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pr-7 text-gray-900 text-sm focus:outline-none focus:border-violet-500 transition-colors text-right"
        dir="ltr"
      />
      {suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{suffix}</span>}
    </div>
  )
}

function PctInput({ value, onChange, min = 0, max = 25 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
        placeholder="0"
        min={min}
        max={max}
        step={0.5}
        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pl-7 text-gray-900 text-sm focus:outline-none focus:border-violet-500 transition-colors text-center"
        dir="ltr"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
    </div>
  )
}

export function OfferCard({ offer, onChange, onRemove, canRemove }: Props) {
  const c = OFFER_COLORS[offer.color]

  return (
    <div className={clsx('rounded-2xl border-2 bg-white overflow-hidden flex flex-col', c.border)}>
      {/* Header */}
      <div className={clsx('px-4 py-3 flex items-center gap-3', c.light)}>
        <div className="flex gap-1">
          {COLORS.map(col => (
            <button
              key={col}
              onClick={() => onChange({ color: col })}
              className={clsx(
                'w-4 h-4 rounded-full transition-transform',
                OFFER_COLORS[col].bg,
                offer.color === col ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'opacity-50 hover:opacity-80'
              )}
            />
          ))}
        </div>
        <input
          value={offer.name}
          onChange={e => onChange({ name: e.target.value })}
          className={clsx('flex-1 bg-transparent font-bold text-sm focus:outline-none', c.text)}
          placeholder="שם החברה / הצעה"
        />
        {canRemove && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">

        {/* שכר בסיס */}
        <Section title="שכר בסיס" icon="💰" defaultOpen>
          <Field label="ברוטו חודשי">
            <NumInput value={offer.grossSalary} onChange={v => onChange({ grossSalary: v })} />
          </Field>
        </Section>

        {/* פנסיה וחיסכון */}
        <Section title="פנסיה וחיסכון" icon="🏦" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <Field label="פנסיה מעסיק %" tooltip="ברירת מחדל 6.5%. חלק ממעסיקים מציעים 7.5% ומעלה">
              <PctInput value={offer.pensionEmployerRate} onChange={v => onChange({ pensionEmployerRate: v })} max={15} />
            </Field>
            <Field label="פנסיה עובד %">
              <PctInput value={offer.pensionEmployeeRate} onChange={v => onChange({ pensionEmployeeRate: v })} max={10} />
            </Field>
          </div>
          <Field label="קרן השתלמות">
            <Toggle
              checked={offer.hasStudyFund}
              onChange={v => onChange({ hasStudyFund: v })}
              label={offer.hasStudyFund ? 'כן' : 'לא'}
            />
          </Field>
          {offer.hasStudyFund && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="השתלמות מעסיק %" tooltip="ברירת מחדל 7.5%. יש שמציעים 8.5%+">
                <PctInput value={offer.studyFundEmployerRate} onChange={v => onChange({ studyFundEmployerRate: v })} max={15} />
              </Field>
              <Field label="השתלמות עובד %">
                <PctInput value={offer.studyFundEmployeeRate} onChange={v => onChange({ studyFundEmployeeRate: v })} max={10} />
              </Field>
            </div>
          )}
        </Section>

        {/* בונוס */}
        <Section title="בונוס" icon="🎁">
          <div className="grid grid-cols-2 gap-3">
            <Field label="בונוס שנתי %" tooltip="% מהשכר השנתי הברוטו">
              <PctInput value={offer.annualBonusPct} onChange={v => onChange({ annualBonusPct: v })} max={200} />
            </Field>
            <Field label="בונוס קבוע שנתי" tooltip="סכום קבוע בנוסף ל-%">
              <NumInput value={offer.annualBonusFixed} onChange={v => onChange({ annualBonusFixed: v })} />
            </Field>
          </div>
          <Field label="Sign-on bonus (חד פעמי)" tooltip="לא נכנס לחישוב השוטף אלא מוצג בנפרד">
            <NumInput value={offer.signOnBonus} onChange={v => onChange({ signOnBonus: v })} />
          </Field>
        </Section>

        {/* הון ומניות */}
        <Section title="הון ומניות (RSU / אופציות)" icon="📈">
          <Field label="RSU — שווי שנתי ממוצע (ברוטו)" tooltip="הערך השנתי הממוצע של RSU לאחר vesting. למשל: $100K grant / 4 שנות vesting = $25K/שנה">
            <NumInput value={offer.rsuAnnualValue} onChange={v => onChange({ rsuAnnualValue: v })} />
          </Field>
          <Field label="מסלול מיסוי RSU" tooltip="סעיף 102 רווחי הון: 25% מס אחרי תקופת החזקה. הכנסת עבודה: מס שולי (עד 47%) — שימו לב שזה הבדל ענק!">
            <div className="grid grid-cols-2 gap-2">
              {(['section102', 'income'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onChange({ rsuTaxType: t })}
                  className={clsx(
                    'py-2 rounded-lg text-xs font-medium border transition-all',
                    offer.rsuTaxType === t
                      ? `${c.border} ${c.light} ${c.text}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {t === 'section102' ? '102 (25%)' : 'הכנסת עבודה'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="אופציות — שווי שנתי משוער (ברוטו)" tooltip="הערך השנתי המשוער של האופציות. שימו לב — אופציות מסוכנות יותר מ-RSU">
            <NumInput value={offer.optionsAnnualValue} onChange={v => onChange({ optionsAnnualValue: v })} />
          </Field>
        </Section>

        {/* אוכל */}
        <Section title="אוכל" icon="🍔">
          <div className="grid grid-cols-2 gap-3">
            <Field label="סיבוס ₪ ליום" tooltip="פטור ממס עד ₪128 ליום (≈₪2,820/חודש). מעבר לכך — חייב במס">
              <NumInput value={offer.cibusPerDay} onChange={v => onChange({ cibusPerDay: v })} />
            </Field>
            <Field label="ימי עבודה/חודש">
              <input
                type="number"
                value={offer.workDaysPerMonth}
                onChange={e => onChange({ workDaysPerMonth: Number(e.target.value) || 22 })}
                min={1} max={31}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                dir="ltr"
              />
            </Field>
          </div>
          <Field label="ארוחות חינם במשרד" tooltip="הנחה: ₪50 לארוחה. מחשבים כהטבה פטורה ממס (כחלק מתנאי עבודה)">
            <div className="flex items-center gap-3">
              <Toggle
                checked={offer.officeMeals}
                onChange={v => onChange({ officeMeals: v })}
                label={offer.officeMeals ? 'כן' : 'לא'}
              />
              {offer.officeMeals && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">ארוחות ביום:</label>
                  <input
                    type="number"
                    value={offer.officeMealsPerDay}
                    onChange={e => onChange({ officeMealsPerDay: Number(e.target.value) || 1 })}
                    min={1} max={3}
                    className="w-14 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                    dir="ltr"
                  />
                </div>
              )}
            </div>
          </Field>
        </Section>

        {/* תחבורה */}
        <Section title="תחבורה" icon="🚗">
          <Field label="רכב חברה — שווי שימוש חודשי" tooltip="שווי השימוש נוסף להכנסה החייבת שלך ואתה משלם עליו מס! למשל רכב ₪120K → שווי שימוש ≈₪2,900/חודש">
            <NumInput value={offer.carImputed} onChange={v => onChange({ carImputed: v })} />
          </Field>
          <Field label="קו כסף / דמי רכב חודשי" tooltip="תשלום מזומן חייב במס — נוסף לנטו שלך אבל גם למס">
            <NumInput value={offer.carAllowance} onChange={v => onChange({ carAllowance: v })} />
          </Field>
          <Field label="החזר נסיעות חודשי" tooltip="פטור ממס עד ≈₪500/חודש">
            <NumInput value={offer.transportationMonthly} onChange={v => onChange({ transportationMonthly: v })} />
          </Field>
          <Field label="חנייה חינם (ערך חודשי)" tooltip="חנייה בחינם שווה ₪400–₪800 בחודש בתל אביב/גוש דן">
            <NumInput value={offer.parkingMonthly} onChange={v => onChange({ parkingMonthly: v })} />
          </Field>
        </Section>

        {/* ביטוחים */}
        <Section title="ביטוחים ובריאות" icon="🏥">
          <Field label="ביטוח בריאות פרטי — ערך חודשי" tooltip="מדיקל, שיניים, ראייה. שווי ₪200–₪600 לחודש לפי כיסוי">
            <NumInput value={offer.healthInsuranceMonthly} onChange={v => onChange({ healthInsuranceMonthly: v })} />
          </Field>
          <Field label="ביטוח חיים נוסף — ערך חודשי">
            <NumInput value={offer.lifeInsuranceMonthly} onChange={v => onChange({ lifeInsuranceMonthly: v })} />
          </Field>
        </Section>

        {/* רווחה */}
        <Section title="רווחה והטבות" icon="🧘">
          <div className="grid grid-cols-2 gap-3">
            <Field label="תקציב רווחה שנתי" tooltip="ספורט, תרבות, נופש, בריאות">
              <NumInput value={offer.welfareAnnualBudget} onChange={v => onChange({ welfareAnnualBudget: v })} />
            </Field>
            <Field label="ימי חופש" tooltip="חוק: 12 יום. ימים מעל 12 נחשבים כהטבה נוספת">
              <input
                type="number"
                value={offer.vacationDays}
                onChange={e => onChange({ vacationDays: Number(e.target.value) || 12 })}
                min={12} max={40}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-500 text-center"
                dir="ltr"
              />
            </Field>
            <Field label="מנוי ספורט חודשי">
              <NumInput value={offer.gymMonthly} onChange={v => onChange({ gymMonthly: v })} />
            </Field>
            <Field label="הכשרות שנתי" tooltip="קורסים, כנסים, ספרים מקצועיים">
              <NumInput value={offer.trainingAnnual} onChange={v => onChange({ trainingAnnual: v })} />
            </Field>
            <Field label="ציוד שנתי" tooltip="מחשב נייד, מסך, כסא ארגונומי וכו'">
              <NumInput value={offer.equipmentAnnual} onChange={v => onChange({ equipmentAnnual: v })} />
            </Field>
            <Field label="טלפון חודשי" tooltip="מכשיר + חבילה">
              <NumInput value={offer.phoneMonthly} onChange={v => onChange({ phoneMonthly: v })} />
            </Field>
          </div>
          <Field label="סיוע בגן ילדים חודשי">
            <NumInput value={offer.childcareMonthly} onChange={v => onChange({ childcareMonthly: v })} />
          </Field>
        </Section>

        {/* גמישות */}
        <Section title="גמישות (ערך איכותי)" icon="🏠">
          <Field label="ימי WFH בשבוע" tooltip="חיסכון בנסיעות, זמן ואיכות חיים. הערך מוצג כחיסכון משוער בלבד">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5].map(d => (
                <button
                  key={d}
                  onClick={() => onChange({ wfhDaysPerWeek: d })}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-bold border transition-all',
                    offer.wfhDaysPerWeek === d
                      ? `${c.border} ${c.light} ${c.text}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">ימים בשבוע מהבית</div>
          </Field>
          <Field label="שעות גמישות">
            <Toggle
              checked={offer.flexibleHours}
              onChange={v => onChange({ flexibleHours: v })}
              label={offer.flexibleHours ? 'כן' : 'לא'}
            />
          </Field>
        </Section>

      </div>
    </div>
  )
}

'use client'

import { clsx } from 'clsx'
import type { JobOffer, OfferResult } from '@/lib/compare-types'
import { OFFER_COLORS } from '@/lib/compare-types'

interface Props {
  offers: JobOffer[]
  results: OfferResult[]
}

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`
const fmtPct = (v: number) => `${Math.round(v * 100)}%`

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function Row({ label, tooltip, offers, results, getValue, isHighlight, isMoney = true, isBold }: {
  label: string
  tooltip?: string
  offers: JobOffer[]
  results: OfferResult[]
  getValue: (r: OfferResult, o: JobOffer) => number
  isHighlight?: boolean
  isMoney?: boolean
  isBold?: boolean
}) {
  const vals = results.map((r, i) => getValue(r, offers[i]))
  const max = Math.max(...vals)

  return (
    <tr className={clsx('border-b border-gray-100', isHighlight && 'bg-green-50')}>
      <td className={clsx('py-3 pr-4 text-sm text-right sticky right-0 bg-white', isHighlight && 'bg-green-50', isBold && 'font-bold text-gray-900')}>
        <span className={clsx('text-gray-600', isBold && 'text-gray-900')}>{label}</span>
        {tooltip && <div className="text-xs text-gray-400 mt-0.5">{tooltip}</div>}
      </td>
      {results.map((result, i) => {
        const val = vals[i]
        const isMax = val === max && max > 0
        const c = OFFER_COLORS[offers[i].color]
        return (
          <td key={result.offerId} className="py-3 px-3 text-center min-w-[110px]">
            <div className={clsx(
              'text-sm font-semibold',
              isMax ? c.text : 'text-gray-700',
              isBold && 'text-base font-black',
              isHighlight && isMax && 'text-green-700'
            )}>
              {isMoney ? fmt(val) : val}
              {isMax && val > 0 && <span className="mr-1 text-xs">★</span>}
            </div>
            {isMoney && max > 0 && <Bar value={val} max={max} color={isMax ? c.hex : '#D1D5DB'} />}
          </td>
        )
      })}
    </tr>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr className="bg-gray-50">
      <td colSpan={99} className="py-2 pr-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</td>
    </tr>
  )
}

export function CompareTable({ offers, results }: Props) {
  if (results.length === 0) return null

  const totalMax = Math.max(...results.map(r => r.totalWithSavingsAnnual))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-black text-gray-900">השוואת הצעות</h2>
        <p className="text-xs text-gray-400 mt-0.5">★ = הטוב ביותר בכל קטגוריה</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 pr-4 text-right text-sm font-medium text-gray-500 sticky right-0 bg-white min-w-[140px]">קטגוריה</th>
              {offers.map((o, i) => {
                const c = OFFER_COLORS[o.color]
                const r = results[i]
                return (
                  <th key={o.id} className="py-3 px-3 text-center min-w-[110px]">
                    <div className={clsx('text-sm font-bold', c.text)}>{o.name || `הצעה ${i + 1}`}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmt(o.grossSalary)}/ח׳</div>
                    {/* Mini total bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalMax > 0 ? (r.totalWithSavingsAnnual / totalMax) * 100 : 0}%`,
                          background: c.hex
                        }}
                      />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>

            {/* שכר */}
            <SectionHeader label="💰 שכר נטו" />
            <Row label="נטו חודשי" tooltip="שכר בסיס נטו אחרי מסים" offers={offers} results={results} getValue={r => r.netSalaryMonthly} isBold />
            <Row label="נטו שנתי" offers={offers} results={results} getValue={r => r.netSalaryAnnual} />
            <Row label="מס אפקטיבי" offers={offers} results={results}
              getValue={r => r.effectiveTaxRate * 100}
              isMoney={false}
              tooltip="אחוז המס האפקטיבי מהשכר"
            />

            {/* בונוס */}
            {results.some(r => r.annualBonusGross > 0) && (
              <>
                <SectionHeader label="🎁 בונוס" />
                <Row label="בונוס שנתי ברוטו" offers={offers} results={results} getValue={r => r.annualBonusGross} />
                <Row label="בונוס שנתי נטו" tooltip="אחרי מס שולי + ביטוח לאומי" offers={offers} results={results} getValue={r => r.annualBonusNet} isBold />
              </>
            )}

            {/* הון */}
            {results.some(r => r.annualEquityGross > 0) && (
              <>
                <SectionHeader label="📈 הון ומניות" />
                <Row label="RSU + אופציות שנתי (ברוטו)" offers={offers} results={results} getValue={r => r.annualEquityGross} />
                <Row label="RSU + אופציות שנתי (נטו)" tooltip="אחרי מס (25% ל-102, שיעור שולי לשאר)" offers={offers} results={results} getValue={r => r.annualEquityNet} isBold />
              </>
            )}

            {/* הטבות */}
            <SectionHeader label="✨ הטבות פטורות ממס" />
            {results.some(r => r.taxFreePerks.cibus > 0) && (
              <Row label="סיבוס (פטור ממס)" offers={offers} results={results} getValue={r => r.taxFreePerks.cibus} />
            )}
            {results.some(r => r.taxFreePerks.officeMeals > 0) && (
              <Row label="ארוחות במשרד" offers={offers} results={results} getValue={r => r.taxFreePerks.officeMeals} />
            )}
            {results.some(r => r.taxFreePerks.healthInsurance > 0) && (
              <Row label="ביטוח בריאות פרטי" offers={offers} results={results} getValue={r => r.taxFreePerks.healthInsurance} />
            )}
            {results.some(r => r.taxFreePerks.welfare > 0) && (
              <Row label="תקציב רווחה" offers={offers} results={results} getValue={r => r.taxFreePerks.welfare} />
            )}
            {results.some(r => r.taxFreePerks.parking > 0) && (
              <Row label="חנייה" offers={offers} results={results} getValue={r => r.taxFreePerks.parking} />
            )}
            {results.some(r => r.taxFreePerks.transportation > 0) && (
              <Row label="נסיעות (פטור)" offers={offers} results={results} getValue={r => r.taxFreePerks.transportation} />
            )}
            {results.some(r => r.taxFreePerks.gym > 0) && (
              <Row label="מנוי ספורט" offers={offers} results={results} getValue={r => r.taxFreePerks.gym} />
            )}
            {results.some(r => r.taxFreePerks.training > 0) && (
              <Row label="הכשרות" offers={offers} results={results} getValue={r => r.taxFreePerks.training} />
            )}
            {results.some(r => r.taxFreePerks.equipment > 0) && (
              <Row label="ציוד" offers={offers} results={results} getValue={r => r.taxFreePerks.equipment} />
            )}
            {results.some(r => r.taxFreePerks.phone > 0) && (
              <Row label="טלפון" offers={offers} results={results} getValue={r => r.taxFreePerks.phone} />
            )}
            {results.some(r => r.taxFreePerks.childcare > 0) && (
              <Row label="גן ילדים" offers={offers} results={results} getValue={r => r.taxFreePerks.childcare} />
            )}
            {results.some(r => r.taxFreePerks.extraVacation > 0) && (
              <Row label="ימי חופש נוספים (ערך)" tooltip="ימים מעל 12 לפי שכר יומי" offers={offers} results={results} getValue={r => r.taxFreePerks.extraVacation} />
            )}
            <Row label="סה״כ הטבות (שנתי)" offers={offers} results={results} getValue={r => r.taxFreePerksTotal} isBold />

            {/* חיסכון */}
            <SectionHeader label="🏦 חיסכון נצבר (שנתי)" />
            <Row label="פנסיה (עובד + מעסיק + פיצויים)" tooltip="כסף שנצבר בשבילך — לא מזומן אבל שלך לחלוטין" offers={offers} results={results} getValue={r => r.annualPensionAccrual} />
            <Row label="קרן השתלמות (עובד + מעסיק)" offers={offers} results={results} getValue={r => r.annualStudyFundAccrual} />
            <Row label="סה״כ חיסכון שנתי" offers={offers} results={results} getValue={r => r.annualPensionAccrual + r.annualStudyFundAccrual} isBold />

            {/* סיכום כולל */}
            <SectionHeader label="🏆 סיכום כולל (שנתי)" />
            <Row
              label="שכר + בונוס + אקוויטי + הטבות"
              tooltip="כל הכסף המזומן + ערך הטבות, שנתי"
              offers={offers} results={results}
              getValue={r => r.totalLiquidAnnual}
              isBold
              isHighlight
            />
            <Row
              label="כולל חיסכון פנסיה + השתלמות"
              tooltip="הערך הכולל ביותר שמשקלל את כל רכיבי החבילה"
              offers={offers} results={results}
              getValue={r => r.totalWithSavingsAnnual}
              isBold
              isHighlight
            />

            {/* sign on */}
            {results.some(r => r.signOnBonus > 0) && (
              <>
                <SectionHeader label="⚡ חד פעמי" />
                <Row label="Sign-on bonus" tooltip="חד פעמי — לא נכנס לסיכום השוטף" offers={offers} results={results} getValue={r => r.signOnBonus} />
              </>
            )}

            {/* WFH */}
            {offers.some(o => o.wfhDaysPerWeek > 0) && (
              <>
                <SectionHeader label="🏠 גמישות" />
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-sm text-gray-600 sticky right-0 bg-white">
                    ימי WFH בשבוע
                    <div className="text-xs text-gray-400 mt-0.5">חיסכון בנסיעות + זמן</div>
                  </td>
                  {offers.map((o, i) => {
                    const c = OFFER_COLORS[o.color]
                    const isMax = o.wfhDaysPerWeek === Math.max(...offers.map(x => x.wfhDaysPerWeek))
                    return (
                      <td key={o.id} className="py-3 px-3 text-center">
                        <div className={clsx('text-sm font-semibold', isMax && o.wfhDaysPerWeek > 0 ? c.text : 'text-gray-700')}>
                          {o.wfhDaysPerWeek} יום{isMax && o.wfhDaysPerWeek > 0 && ' ★'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {o.wfhDaysPerWeek > 0 ? `≈${fmt(o.wfhDaysPerWeek * 4 * 60 + o.wfhDaysPerWeek * 4 * 50)}/חודש חיסכון` : '—'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 text-sm text-gray-600 sticky right-0 bg-white">שעות גמישות</td>
                  {offers.map((o) => (
                    <td key={o.id} className="py-3 px-3 text-center text-sm text-gray-600">
                      {o.flexibleHours ? '✓ כן' : '—'}
                    </td>
                  ))}
                </tr>
              </>
            )}

          </tbody>
        </table>
      </div>
    </div>
  )
}

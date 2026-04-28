'use client'

import { useEffect, useState } from 'react'
import { TaxBreakdownPie } from '@/components/charts/TaxBreakdownPie'
import { SalaryFlowChart } from '@/components/charts/SalaryFlowChart'
import { TotalCompensationView } from './TotalCompensationView'
import { PensionProjector } from './PensionProjector'
import { FinalSummaryCard } from './FinalSummaryCard'
import { ExportButtons } from './ExportButtons'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { CalculatorResult } from '@/lib/types'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  result: CalculatorResult | null
  loading?: boolean
  currentAge: number
  retirementAge: number
  pensionReturnRate: number
  existingPensionBalance: number
  onRetirementAgeChange: (v: number) => void
  onReturnRateChange: (v: number) => void
  onExistingBalanceChange: (v: number) => void
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value)

  useEffect(() => {
    const start = displayed
    const end = value
    const duration = 400
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className={className}>₪{displayed.toLocaleString('he-IL')}</span>
}

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

const TABS = [
  { id: 'net', label: 'כמה לכיס' },
  { id: 'full', label: 'תמונה מלאה' },
  { id: 'pension', label: 'עתיד פנסיוני' }
] as const

type TabId = typeof TABS[number]['id']

export function ResultsPanel({
  result, loading, currentAge, retirementAge, pensionReturnRate, existingPensionBalance,
  onRetirementAgeChange, onReturnRateChange, onExistingBalanceChange
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('net')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [showCredits, setShowCredits] = useState(false)

  if (loading || !result) {
    return (
      <Card className="h-64 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">מחשב...</div>
      </Card>
    )
  }

  const totalDeductions = result.grossMonthly - result.netMonthly
  const deductionPct = result.grossMonthly > 0 ? (totalDeductions / result.grossMonthly) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Hidden print target */}
      <div id="print-report" style={{ display: 'none' }} />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: כמה לכיס */}
      {activeTab === 'net' && (
        <div className="space-y-4">
          {/* Main net */}
          <Card glow className="text-center">
            <div className="text-xs text-gray-400 mb-1">נטו לחודש</div>
            <AnimatedNumber
              value={Math.round(result.netMonthly)}
              className="text-5xl font-black text-green-600 tabular-nums"
            />
            <div className="text-xs text-gray-400 mt-1">
              {fmt(result.netAnnual)} לשנה
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>ברוטו {fmt(result.grossMonthly)}</span>
                <span>נשאר {Math.round(result.netPercent)}%</span>
              </div>
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, result.netPercent)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 text-center">
                ניכויים {Math.round(deductionPct)}% = {fmt(totalDeductions)}/חודש
              </div>
            </div>
          </Card>

          {/* Flow chart */}
          <Card>
            <div className="text-xs text-gray-400 mb-3">לאן הולך כל שקל</div>
            <SalaryFlowChart result={result} />
          </Card>

          {/* Deductions */}
          <Card>
            <div className="space-y-3">
              <DeductionRow label="מס הכנסה" monthly={result.deductions.incomeTax.monthly} annual={result.deductions.incomeTax.annual} color="text-red-600" badge={`${Math.round((result.deductions.incomeTax.rate ?? 0) * 100)}% אפקטיבי`} />
              <DeductionRow label="ביטוח לאומי" monthly={result.deductions.bituachLeumi.monthly} annual={result.deductions.bituachLeumi.annual} color="text-blue-600" />
              <DeductionRow label="ביטוח בריאות" monthly={result.deductions.bituachBriut.monthly} annual={result.deductions.bituachBriut.annual} color="text-violet-600" />
              <DeductionRow label="פנסיה עובד" monthly={result.deductions.pension.monthly} annual={result.deductions.pension.annual} color="text-orange-600" />
              {result.deductions.studyFundEmployee && (
                <DeductionRow label="השתלמות עובד" monthly={result.deductions.studyFundEmployee.monthly} annual={result.deductions.studyFundEmployee.annual} color="text-violet-500" />
              )}
              <div className="border-t border-gray-200 pt-2">
                <DeductionRow label="סה״כ ניכויים" monthly={totalDeductions} annual={totalDeductions * 12} color="text-gray-700" bold />
              </div>
            </div>
          </Card>

          {/* Pie */}
          <Card>
            <div className="text-xs text-gray-400 text-center mb-2">פילוח ברוטו</div>
            <TaxBreakdownPie result={result} />
          </Card>

          {/* Final Summary */}
          <FinalSummaryCard result={result} />

          {/* Smart Insights */}
          <SmartInsights result={result} />

          {/* Brackets */}
          {result.taxBreakdown.length > 0 && (
            <Card>
              <button onClick={() => setShowBreakdown(!showBreakdown)} className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <span>מדרגות מס הכנסה</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBreakdown && (
                <div className="mt-3 space-y-1.5">
                  <div className="hidden sm:grid grid-cols-4 text-xs text-gray-400 border-b border-gray-200 pb-2 gap-1">
                    <span>מדרגה</span><span>טווח חודשי</span><span>הכנסה</span><span>מס</span>
                  </div>
                  <div className="grid sm:hidden grid-cols-3 text-xs text-gray-400 border-b border-gray-200 pb-2 gap-1">
                    <span>מדרגה</span><span>טווח</span><span>מס</span>
                  </div>
                  {result.taxBreakdown.map((b, i) => {
                    const toM = b.to !== null ? fmt(b.to / 12) : '∞'
                    const fromM = fmt(b.from / 12)
                    return (
                      <div key={i}>
                        {/* Desktop row */}
                        <div className={clsx('hidden sm:grid grid-cols-4 text-xs gap-1 py-0.5 rounded px-1', b.isActive ? 'text-gray-700' : 'text-gray-300')}>
                          <span className={b.isActive ? 'text-violet-600 font-semibold' : 'text-gray-300'}>{b.bracket}</span>
                          <span>{fromM}–{toM}</span>
                          <span>{b.isActive ? `${fmt(b.income / 12)}/ח׳` : '—'}</span>
                          <span>{b.isActive ? `${fmt(b.tax / 12)}/ח׳` : '—'}</span>
                        </div>
                        {/* Mobile row */}
                        <div className={clsx('grid sm:hidden grid-cols-3 text-xs gap-1 py-0.5 rounded px-1', b.isActive ? 'text-gray-700' : 'text-gray-300')}>
                          <span className={b.isActive ? 'text-violet-600 font-semibold' : 'text-gray-300'}>{b.bracket}</span>
                          <span className="text-xs">{fromM}–{toM}</span>
                          <span>{b.isActive ? `${fmt(b.tax / 12)}/ח׳` : '—'}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>מס ברוטו לפני זיכויים</span>
                      <span>{fmt(result.grossTaxBeforeCredits / 12)}/ח׳</span>
                    </div>
                    {result.creditAmount > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>זיכוי נקודות ({result.creditPoints.toFixed(2)} נק׳)</span>
                        <span>−{fmt(result.creditAmount / 12)}/ח׳</span>
                      </div>
                    )}
                    {result.settlementDiscount > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>הנחת יישוב מזכה</span>
                        <span>−{fmt(result.settlementDiscount / 12)}/ח׳</span>
                      </div>
                    )}
                    {result.pensionTaxCredit > 0 && (
                      <div className="flex justify-between text-xs text-green-600">
                        <span>זיכוי מס פנסיה</span>
                        <span>−{fmt(result.pensionTaxCredit / 12)}/ח׳</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-red-600 border-t border-gray-200 pt-1">
                      <span>מס הכנסה סופי</span>
                      <span>{fmt(result.deductions.incomeTax.monthly)}/ח׳</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Credits */}
          <Card>
            <button onClick={() => setShowCredits(!showCredits)} className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <div className="flex items-center gap-2">
                <span>נקודות זיכוי</span>
                <span className="text-violet-600 font-bold">{result.creditPoints.toFixed(2)} נק׳</span>
                <span className="text-gray-400 text-xs">(={fmt(result.creditAmount / 12)}/ח׳)</span>
              </div>
              {showCredits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCredits && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 mb-2">כל נקודת זיכוי שווה {`₪242`} לחודש (₪2,904 לשנה)</div>
                {result.creditBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="gold">{item.points} נק׳</Badge>
                      <span className="text-green-600 w-16 text-left">{fmt(item.points * 242)}/ח׳</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-bold">
                  <span className="text-gray-700">סה״כ חיסכון מס</span>
                  <span className="text-violet-600">{fmt(result.creditAmount / 12)}/ח׳ · {fmt(result.creditAmount)}/שנה</span>
                </div>
              </div>
            )}
          </Card>

          {/* Export CTA */}
          <div className="rounded-2xl overflow-hidden border border-violet-200 bg-violet-50">
            <div className="px-4 pt-4 pb-3 border-b border-violet-100">
              <div className="text-sm font-bold text-gray-900 mb-0.5">הפקת דוח מותאם אישית</div>
              <div className="text-xs text-gray-500">ייצא את כל הנתונים שלך לקובץ מסודר</div>
            </div>
            <div className="p-4">
              <ExportButtons result={result} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: תמונה מלאה */}
      {activeTab === 'full' && (
        result.employerCost
          ? <TotalCompensationView result={result} />
          : (
            <Card className="text-center py-10">
              <p className="text-gray-400 text-sm">זמין לשכיר בלבד</p>
            </Card>
          )
      )}

      {/* Tab: עתיד פנסיוני */}
      {activeTab === 'pension' && (
        <PensionProjector
          result={result}
          currentAge={currentAge}
          retirementAge={retirementAge}
          returnRate={pensionReturnRate}
          existingBalance={existingPensionBalance}
          onRetirementAgeChange={onRetirementAgeChange}
          onReturnRateChange={onReturnRateChange}
          onExistingBalanceChange={onExistingBalanceChange}
        />
      )}
    </div>
  )
}

function DeductionRow({ label, monthly, annual, color, badge, bold }: {
  label: string; monthly: number; annual: number; color: string; badge?: string; bold?: boolean
}) {
  return (
    <div className={clsx('flex items-center justify-between', bold && 'font-semibold')}>
      <div className="flex items-center gap-2">
        <span className={clsx('text-sm', color)}>{label}</span>
        {badge && <Badge variant="gray">{badge}</Badge>}
      </div>
      <div className="text-left">
        <div className={clsx('text-sm', color)}>{fmt(monthly)}/ח׳</div>
        <div className="text-xs text-gray-400">{fmt(annual)}/שנה</div>
      </div>
    </div>
  )
}

function SmartInsights({ result }: { result: CalculatorResult }) {
  const insights: { icon: string; text: string; color: string }[] = []

  const effectivePct = Math.round((result.deductions.incomeTax.rate ?? 0) * 100)
  const retained = Math.round(result.netPercent)
  insights.push({
    icon: '📊',
    text: `מס הכנסה אפקטיבי ${effectivePct}% — על כל ₪100 ברוטו נשארים לכיס ₪${retained}`,
    color: 'text-gray-600'
  })

  if (result.creditAmount > 0) {
    const activeBracket = [...result.taxBreakdown].reverse().find(b => b.isActive)
    const topRate = activeBracket ? Math.round(activeBracket.rate * 100) : 0
    insights.push({
      icon: '🎯',
      text: `נקודות הזיכוי שלך (${result.creditPoints.toFixed(2)}) חוסכות ${fmt(result.creditAmount / 12)} מסים בחודש — ${fmt(result.creditAmount)} בשנה`,
      color: 'text-green-600'
    })
    if (topRate > 0) {
      insights.push({
        icon: '💡',
        text: `המדרגה הגבוהה שלך היא ${topRate}% — כל תרומה לפנסיה/קרן השתלמות מוכרת מחסכת ${topRate} אגורות מס על כל שקל`,
        color: 'text-blue-600'
      })
    }
  }

  if (result.settlementDiscount > 0) {
    insights.push({
      icon: '🏘️',
      text: `הנחת יישוב מזכה חוסכת לך ${fmt(result.settlementDiscount / 12)} מסים בחודש`,
      color: 'text-violet-600'
    })
  }

  if (result.employerCost) {
    const totalCost = result.employerCost.totalEmployerCost
    const ratio = Math.round((result.netMonthly / totalCost) * 100)
    insights.push({
      icon: '🏢',
      text: `המעסיק משלם ${fmt(totalCost)}/חודש — הנטו שלך הוא ${ratio}% מסך עלותך למעסיק`,
      color: 'text-violet-600'
    })
  }

  return (
    <Card>
      <div className="text-xs text-gray-400 font-medium mb-3">תובנות חכמות</div>
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <div key={i} className="flex gap-2.5 text-xs">
            <span className="shrink-0 mt-0.5">{ins.icon}</span>
            <span className={ins.color}>{ins.text}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

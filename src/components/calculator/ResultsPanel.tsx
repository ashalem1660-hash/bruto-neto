'use client'

import { useEffect, useState } from 'react'
import { TaxBreakdownPie } from '@/components/charts/TaxBreakdownPie'
import { SalaryFlowChart } from '@/components/charts/SalaryFlowChart'
import { TotalCompensationView } from './TotalCompensationView'
import { PensionProjector } from './PensionProjector'
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
        <div className="text-white/30 text-sm animate-pulse">מחשב...</div>
      </Card>
    )
  }

  const totalDeductions = result.grossMonthly - result.netMonthly
  const deductionPct = result.grossMonthly > 0 ? (totalDeductions / result.grossMonthly) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-2xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-amber-500 text-gray-900 shadow-sm'
                : 'text-white/50 hover:text-white/80'
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
            <div className="text-xs text-white/40 mb-1">נטו לחודש</div>
            <AnimatedNumber
              value={Math.round(result.netMonthly)}
              className="text-5xl font-black text-amber-400 tabular-nums"
            />
            <div className="text-xs text-white/40 mt-1">
              {fmt(result.netAnnual)} לשנה
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>ברוטו {fmt(result.grossMonthly)}</span>
                <span>נשאר {Math.round(result.netPercent)}%</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(0, result.netPercent)}%` }}
                />
              </div>
              <div className="text-xs text-white/30 text-center">
                ניכויים {Math.round(deductionPct)}% = {fmt(totalDeductions)}/חודש
              </div>
            </div>
          </Card>

          {/* Flow chart */}
          <Card>
            <div className="text-xs text-white/40 mb-3">לאן הולך כל שקל</div>
            <SalaryFlowChart result={result} />
          </Card>

          {/* Deductions */}
          <Card>
            <div className="space-y-3">
              <DeductionRow label="מס הכנסה" monthly={result.deductions.incomeTax.monthly} annual={result.deductions.incomeTax.annual} color="text-amber-400" badge={`${Math.round((result.deductions.incomeTax.rate ?? 0) * 100)}% אפקטיבי`} />
              <DeductionRow label="ביטוח לאומי" monthly={result.deductions.bituachLeumi.monthly} annual={result.deductions.bituachLeumi.annual} color="text-blue-400" />
              <DeductionRow label="ביטוח בריאות" monthly={result.deductions.bituachBriut.monthly} annual={result.deductions.bituachBriut.annual} color="text-purple-400" />
              <DeductionRow label="פנסיה עובד" monthly={result.deductions.pension.monthly} annual={result.deductions.pension.annual} color="text-orange-400" />
              {result.deductions.studyFundEmployee && (
                <DeductionRow label="השתלמות עובד" monthly={result.deductions.studyFundEmployee.monthly} annual={result.deductions.studyFundEmployee.annual} color="text-violet-400" />
              )}
              <div className="border-t border-white/10 pt-2">
                <DeductionRow label="סה״כ ניכויים" monthly={totalDeductions} annual={totalDeductions * 12} color="text-white/80" bold />
              </div>
            </div>
          </Card>

          {/* Pie */}
          <Card>
            <div className="text-xs text-white/40 text-center mb-2">פילוח ברוטו</div>
            <TaxBreakdownPie result={result} />
          </Card>

          {/* Brackets */}
          {result.taxBreakdown.length > 0 && (
            <Card>
              <button onClick={() => setShowBreakdown(!showBreakdown)} className="w-full flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors">
                <span>מדרגות מס</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBreakdown && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-white/40 flex justify-between border-b border-white/10 pb-2">
                    <span>שיעור</span><span>הכנסה</span><span>מס</span>
                  </div>
                  {result.taxBreakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs text-white/70">
                      <span className="text-amber-400/80">{b.bracket}</span>
                      <span>{fmt(b.income / 12)}/ח׳</span>
                      <span>{fmt(b.tax / 12)}/ח׳</span>
                    </div>
                  ))}
                  {result.creditAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-400 pt-2 border-t border-white/10">
                      <span>זיכוי נקודות ({result.creditPoints} נק׳)</span>
                      <span>−{fmt(result.creditAmount / 12)}/ח׳</span>
                    </div>
                  )}
                  {result.settlementDiscount > 0 && (
                    <div className="flex justify-between text-xs text-green-400">
                      <span>הנחת יישוב מזכה</span>
                      <span>−{fmt(result.settlementDiscount / 12)}/ח׳</span>
                    </div>
                  )}
                  {result.pensionTaxCredit > 0 && (
                    <div className="flex justify-between text-xs text-green-400">
                      <span>זיכוי מס פנסיה</span>
                      <span>−{fmt(result.pensionTaxCredit / 12)}/ח׳</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Credits */}
          <Card>
            <button onClick={() => setShowCredits(!showCredits)} className="w-full flex items-center justify-between text-sm text-white/60 hover:text-white transition-colors">
              <span>נקודות זיכוי — {result.creditPoints} נק׳</span>
              {showCredits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showCredits && (
              <div className="mt-3 space-y-2">
                {result.creditBreakdown.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-white/60">{item.label}</span>
                    <Badge variant="gold">{item.points} נק׳</Badge>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 flex justify-between text-xs font-bold">
                  <span className="text-white/70">שווי כספי</span>
                  <span className="text-amber-400">{fmt(result.creditAmount / 12)}/ח׳</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: תמונה מלאה */}
      {activeTab === 'full' && (
        result.employerCost
          ? <TotalCompensationView result={result} />
          : (
            <Card className="text-center py-10">
              <p className="text-white/40 text-sm">זמין לשכיר בלבד</p>
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
        <div className="text-xs text-white/30">{fmt(annual)}/שנה</div>
      </div>
    </div>
  )
}

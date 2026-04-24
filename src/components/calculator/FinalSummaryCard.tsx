'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import type { CalculatorResult } from '@/lib/types'
import { clsx } from 'clsx'

interface Props {
  result: CalculatorResult
}

type Period = 'monthly' | 'annual'

const n = (v: number) => Math.round(v).toLocaleString('he-IL')

const COLORS: Record<string, { hex: string; bg: string; text: string }> = {
  tax:     { hex: '#ef4444', bg: 'bg-red-500',    text: 'text-red-400' },
  bl:      { hex: '#3b82f6', bg: 'bg-blue-500',   text: 'text-blue-400' },
  briut:   { hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-400' },
  pension: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400' },
  study:   { hex: '#8b5cf6', bg: 'bg-violet-500', text: 'text-violet-400' },
  net:     { hex: '#F5C518', bg: 'bg-amber-400',  text: 'text-amber-400' },
  accrual: { hex: '#10b981', bg: 'bg-emerald-500','text': 'text-emerald-400' },
}

interface RowData {
  key: string
  label: string
  sublabel?: string
  value: number
  pct: number
  negative?: boolean
  accrual?: boolean
}

export function FinalSummaryCard({ result }: Props) {
  const [period, setPeriod] = useState<Period>('monthly')
  const m = period === 'monthly' ? 1 : 12
  const gross = result.grossMonthly * m

  const rows: RowData[] = [
    {
      key: 'tax', label: 'מס הכנסה',
      sublabel: `שיעור אפקטיבי ${Math.round((result.deductions.incomeTax.rate ?? 0) * 100)}%`,
      value: result.deductions.incomeTax.monthly * m,
      pct: gross > 0 ? (result.deductions.incomeTax.monthly / result.grossMonthly) * 100 : 0,
      negative: true,
    },
    {
      key: 'bl', label: 'ביטוח לאומי',
      value: result.deductions.bituachLeumi.monthly * m,
      pct: gross > 0 ? (result.deductions.bituachLeumi.monthly / result.grossMonthly) * 100 : 0,
      negative: true,
    },
    {
      key: 'briut', label: 'ביטוח בריאות',
      value: result.deductions.bituachBriut.monthly * m,
      pct: gross > 0 ? (result.deductions.bituachBriut.monthly / result.grossMonthly) * 100 : 0,
      negative: true,
    },
    {
      key: 'pension', label: 'פנסיה (עובד)',
      sublabel: 'נצבר לגמלה',
      value: result.deductions.pension.monthly * m,
      pct: gross > 0 ? (result.deductions.pension.monthly / result.grossMonthly) * 100 : 0,
      negative: true,
    },
    ...(result.deductions.studyFundEmployee ? [{
      key: 'study', label: 'קרן השתלמות (עובד)',
      sublabel: 'נצבר לטובתך',
      value: result.deductions.studyFundEmployee.monthly * m,
      pct: gross > 0 ? (result.deductions.studyFundEmployee.monthly / result.grossMonthly) * 100 : 0,
      negative: true,
    }] : []),
  ].filter(r => r.value > 0)

  const totalDeductionsPct = rows.reduce((s, r) => s + r.pct, 0)
  const net = result.netMonthly * m
  const netPct = Math.round(result.netPercent)

  // accrual rows (employee only)
  const pensionTotal = result.employerCost
    ? (result.deductions.pension.monthly + result.employerCost.pensionEmployer + result.employerCost.severancePay) * m
    : result.deductions.pension.monthly * m

  const studyTotal = result.studyFund ? result.studyFund.total * m : 0

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-bold text-white">סיכום פיננסי מלא</div>
          <div className="text-xs text-white/30 mt-0.5">לאן הולך כל שקל</div>
        </div>
        <div className="flex bg-white/8 rounded-xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                period === p ? 'bg-amber-500 text-gray-900 shadow-sm' : 'text-white/50 hover:text-white'
              )}>
              {p === 'monthly' ? 'חודשי' : 'שנתי'}
            </button>
          ))}
        </div>
      </div>

      {/* Gross */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-sm text-white/60">הכנסה ברוטו</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">100%</span>
          <span className="text-lg font-black text-white">₪{n(gross)}</span>
        </div>
      </div>

      {/* Visual stack bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4 gap-px">
        {rows.map(row => (
          <div key={row.key} className="h-full transition-all duration-700"
            style={{ width: `${row.pct}%`, background: COLORS[row.key]?.hex }} />
        ))}
        <div className="h-full flex-1 transition-all duration-700" style={{ background: COLORS.net.hex, opacity: 0.6 }} />
      </div>

      {/* Deduction rows */}
      <div className="space-y-3 mb-4">
        {rows.map(row => {
          const c = COLORS[row.key]
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.hex }} />
                  <span className="text-white/70">{row.label}</span>
                  {row.sublabel && (
                    <span className="text-xs text-white/25 hidden sm:inline">({row.sublabel})</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', c.text)}
                    style={{ background: c.hex + '18' }}>
                    {row.pct.toFixed(1)}%
                  </span>
                  <span className={clsx('font-semibold tabular-nums', c.text)}>
                    −₪{n(row.value)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, row.pct * 2.5)}%`, background: c.hex, opacity: 0.55 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/20">סה״כ ניכויים {Math.round(totalDeductionsPct)}%</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Net to bank */}
      <div className="rounded-2xl px-4 py-4 mb-4 flex items-center justify-between"
        style={{ background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.18)' }}>
        <div>
          <div className="text-xs text-white/40 mb-1">נטו לחשבון הבנק</div>
          <div className="text-3xl font-black text-amber-400 tabular-nums">₪{n(net)}</div>
          <div className="text-xs text-white/30 mt-0.5">
            {period === 'annual' ? `₪${n(result.netMonthly)} בחודש` : `₪${n(result.netAnnual)} בשנה`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black leading-none" style={{ color: 'rgba(245,197,24,0.5)' }}>{netPct}%</div>
          <div className="text-xs text-white/30 mt-1">מהברוטו נשאר לך</div>
        </div>
      </div>

      {/* Accruals (employee) */}
      {result.employerCost && (
        <>
          <div className="text-xs text-white/30 font-medium mb-3">נצבר בשבילך (לא לחשבון, אבל שלך)</div>
          <div className="space-y-2 mb-4">
            <AccrualLine
              label={`פנסיה (עובד ${n(result.deductions.pension.monthly * m)} + מעסיק+פיצויים ${n((result.employerCost.pensionEmployer + result.employerCost.severancePay) * m)})`}
              value={pensionTotal}
              color={COLORS.pension.hex}
            />
            {studyTotal > 0 && result.studyFund && (
              <AccrualLine
                label={`קרן השתלמות (עובד ${n(result.studyFund.employeeContribution * m)} + מעסיק ${n(result.studyFund.employerContribution * m)})`}
                value={studyTotal}
                color={COLORS.study.hex}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm text-white/40">עלות כוללת למעסיק</span>
            <span className="font-bold text-white text-lg">₪{n(result.employerCost.totalEmployerCost * m)}</span>
          </div>
        </>
      )}
    </Card>
  )
}

function AccrualLine({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm px-1">
      <div className="flex items-start gap-2 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: color }} />
        <span className="text-white/50 text-xs leading-snug">{label}</span>
      </div>
      <span className="font-semibold text-emerald-400 shrink-0">+₪{Math.round(value).toLocaleString('he-IL')}</span>
    </div>
  )
}

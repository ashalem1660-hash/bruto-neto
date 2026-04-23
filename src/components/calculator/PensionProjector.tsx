'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { CalculatorResult } from '@/lib/types'
import { Tooltip } from '@/components/ui/Tooltip'
import { Slider } from '@/components/ui/Slider'
import { calculatePensionProjection } from '@/lib/tax-calculator'

interface Props {
  result: CalculatorResult
  currentAge: number
  onRetirementAgeChange: (v: number) => void
  onReturnRateChange: (v: number) => void
  retirementAge: number
  returnRate: number
  existingBalance: number
  onExistingBalanceChange: (v: number) => void
}

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`
const fmtM = (v: number) => v >= 1000000
  ? `₪${(v / 1000000).toFixed(2)}מ׳`
  : `₪${Math.round(v / 1000)}K`

export function PensionProjector({
  result, currentAge, retirementAge, returnRate, existingBalance,
  onRetirementAgeChange, onReturnRateChange, onExistingBalanceChange
}: Props) {
  const [lifeExpectancy] = useState(85)

  const monthlyAccrual = result.pensionProjection?.monthlyAccrual ?? 0

  // build chart data — one point every 5 years
  const chartData: Array<{ age: number; balance: number }> = []
  for (let age = currentAge; age <= retirementAge; age++) {
    const proj = calculatePensionProjection(monthlyAccrual, currentAge, age, returnRate, existingBalance, lifeExpectancy)
    chartData.push({ age, balance: Math.round(proj.projectedBalance) })
  }

  const finalProjection = calculatePensionProjection(
    monthlyAccrual, currentAge, retirementAge, returnRate, existingBalance, lifeExpectancy
  )

  const yearsLeft = Math.max(0, retirementAge - currentAge)

  return (
    <div className="space-y-5">
      {/* Big number */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
        <div className="text-xs text-amber-400/60 mb-1">צבירה פנסיונית משוערת</div>
        <div className="text-4xl font-black text-amber-400">
          {fmtM(finalProjection.projectedBalance)}
        </div>
        <div className="text-sm text-white/50 mt-1">בגיל {retirementAge} — בעוד {yearsLeft} שנים</div>

        <div className="mt-4 pt-4 border-t border-amber-500/20 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-white/40">קצבה חודשית משוערת</div>
            <div className="text-xl font-black text-green-400 mt-1">
              {fmt(finalProjection.estimatedMonthlyPension)}
            </div>
            <div className="text-xs text-white/30">לפי תוחלת חיים {lifeExpectancy}</div>
          </div>
          <div>
            <div className="text-xs text-white/40">הפרשה חודשית (עובד+מעסיק)</div>
            <div className="text-xl font-black text-blue-400 mt-1">
              {fmt(monthlyAccrual)}
            </div>
            <div className="text-xs text-white/30">נצבר {fmt(monthlyAccrual * 12)} בשנה</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40 mb-3">צבירה לאורך השנים</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="age"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={v => fmtM(v)}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  orientation="left"
                />
                <ReTooltip
                  formatter={(v) => [fmtM(Number(v)), 'צבירה']}
                  labelFormatter={(l) => `גיל ${l}`}
                  contentStyle={{
                    background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: '#fff', direction: 'rtl', fontSize: 12
                  }}
                />
                <ReferenceLine x={retirementAge} stroke="rgba(245,197,24,0.4)" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#F5C518"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#F5C518' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="text-xs text-white/40 font-medium mb-1">שחק עם הפרמטרים</div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/60">גיל פרישה</span>
            <span className="text-amber-400 font-bold">{retirementAge}</span>
          </div>
          <Slider value={retirementAge} min={55} max={75} step={1} onChange={onRetirementAgeChange} />
          <div className="flex justify-between text-xs text-white/30 mt-1"><span>75</span><span>55</span></div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">תשואה שנתית צפויה</span>
              <Tooltip content="ממוצע היסטורי של קרנות פנסיה בישראל: 4%–6%. ברירת מחדל 4% — שמרני." />
            </div>
            <span className="text-amber-400 font-bold">{returnRate}%</span>
          </div>
          <Slider value={returnRate} min={1} max={8} step={0.5} onChange={onReturnRateChange} />
          <div className="flex justify-between text-xs text-white/30 mt-1"><span>8%</span><span>1%</span></div>
        </div>

        <div>
          <label className="text-sm text-white/60 block mb-2">
            צבירה פנסיונית קיימת (אופציונלי)
          </label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 text-sm font-bold">₪</span>
            <input
              type="number"
              value={existingBalance}
              onChange={e => onExistingBalanceChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-amber-500 text-right"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* Self employed pension tax saving */}
      {result.selfEmployedPensionTax && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="text-xs text-green-400/70 font-medium mb-3 flex items-center gap-2">
            חיסכון מס על הפרשה לפנסיה (עצמאי)
            <Tooltip content="עצמאי מקבל 2 הטבות מס: ניכוי מס (סעיף 47) שמוריד מההכנסה החייבת, וזיכוי מס (סעיף 45א) שמוריד ישירות מהמס." />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">ניכוי סעיף 47 (מהכנסה)</span>
              <span className="text-green-300">{fmt(result.selfEmployedPensionTax.deduction47)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">זיכוי סעיף 45א (מהמס)</span>
              <span className="text-green-300">{fmt(result.selfEmployedPensionTax.credit45a)}</span>
            </div>
            <div className="border-t border-green-500/20 pt-2 flex justify-between font-bold">
              <span className="text-white/80">חיסכון מס סה״כ</span>
              <span className="text-green-400">{fmt(result.selfEmployedPensionTax.totalTaxSaving)}</span>
            </div>
            <div className="text-xs text-white/40">
              עלות ההפרשה בפועל לאחר הטבות: {fmt(result.selfEmployedPensionTax.effectiveAnnualCost)} לשנה
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-white/20 text-center">
        * הצבירה המשוערת אינה מהווה ייעוץ פנסיוני. בפועל: תשואה, דמי ניהול ותנאי השוק משפיעים על התוצאה.
      </div>
    </div>
  )
}

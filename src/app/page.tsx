'use client'

import { useState } from 'react'
import { useTaxParams } from '@/hooks/useTaxParams'
import { useCalculator } from '@/hooks/useCalculator'
import { EmployeeTypeSelector } from '@/components/calculator/EmployeeTypeSelector'
import { SalaryInput } from '@/components/calculator/SalaryInput'
import { PersonalDetailsForm } from '@/components/calculator/PersonalDetailsForm'
import { ChildrenInput } from '@/components/calculator/ChildrenInput'
import { SettlementSelect } from '@/components/calculator/SettlementSelect'
import { DisabilityInput } from '@/components/calculator/DisabilityInput'
import { PensionInput } from '@/components/calculator/PensionInput'
import { StudyFundInput } from '@/components/calculator/StudyFundInput'
import { SelfEmployedForm } from '@/components/calculator/SelfEmployedForm'
import { AdditionalOptions } from '@/components/calculator/AdditionalOptions'
import { ResultsPanel } from '@/components/calculator/ResultsPanel'
import { Card } from '@/components/ui/Card'
import { Tooltip } from '@/components/ui/Tooltip'
import { Settings, Calculator, ChevronDown, ChevronUp } from 'lucide-react'

export default function HomePage() {
  const { data, loading } = useTaxParams()
  const { input, result, updateInput } = useCalculator(data.params)
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A14' }}>
        <div className="text-white/40 text-lg animate-pulse">טוען פרמטרי מס...</div>
      </div>
    )
  }

  const isSelf = input.employeeType === 'self_employed'
  const monthlyGross = isSelf
    ? (input.annualRevenue - input.annualExpenses) / 12
    : input.grossIncome

  return (
    <div className="min-h-screen" style={{ background: '#0A0A14' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F5C518 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl"
        style={{ background: 'rgba(10,10,20,0.9)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: 'linear-gradient(135deg, #F5C518, #e6a800)' }}>
              <span style={{ color: '#0A0A14' }}>ב←נ</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-white leading-none">ברוטו לנטו</h1>
              <p className="text-xs text-white/40">גלה לאן הכסף שלך הולך</p>
            </div>
          </div>
          <a href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">אדמין</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — form */}
          <div className="lg:col-span-3 space-y-5">
            <div className="text-center lg:text-right">
              <p className="text-amber-400/70 text-sm font-semibold mb-1 tracking-wide">
                כאן בודקים כמה נטו נשאר מהברוטו
              </p>
              <h2 className="text-3xl font-black text-white leading-tight">
                כמה נשאר לך אחרי מסים?
              </h2>
              <p className="text-white/40 mt-2 text-sm">
                מחשבון מיסוי חכם שאומר לך לאן הכסף הולך — ובכמה
              </p>
            </div>

            {/* Employee type */}
            <Card>
              <div className="text-xs text-white/40 font-medium mb-3 flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5" />
                סוג עובד
              </div>
              <EmployeeTypeSelector
                value={input.employeeType}
                onChange={v => updateInput({ employeeType: v })}
              />
            </Card>

            {/* Salary / Revenue */}
            <Card>
              <div className="text-xs text-white/40 font-medium mb-4">
                {isSelf ? 'הכנסות העסק' : 'שכר ברוטו'}
              </div>
              {isSelf
                ? <SelfEmployedForm input={input} onChange={updateInput} />
                : <SalaryInput value={input.grossIncome} onChange={v => updateInput({ grossIncome: v })} />
              }
            </Card>

            {/* Personal details */}
            <Card>
              <div className="text-xs text-white/40 font-medium mb-4">פרטים אישיים</div>
              <PersonalDetailsForm input={input} onChange={updateInput} />
            </Card>

            {/* Children */}
            <Card>
              <ChildrenInput
                children={input.children}
                onChange={children => updateInput({ children })}
              />
            </Card>

            {/* Pension + Study Fund */}
            <Card>
              <div className="text-xs text-white/40 font-medium mb-4">פנסיה וחיסכון</div>
              <div className="space-y-5">
                <PensionInput
                  value={isSelf ? input.pensionSelfRate : input.pensionRate}
                  onChange={v => updateInput(isSelf ? { pensionSelfRate: v } : { pensionRate: v })}
                  isSelfEmployed={isSelf}
                  monthlyGross={monthlyGross}
                />
                <div className="border-t border-white/10 pt-4">
                  <StudyFundInput input={input} onChange={updateInput} />
                </div>

                {/* אובדן כושר עבודה — עצמאי בלבד */}
                {isSelf && (
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60">ביטוח אובדן כושר עבודה</span>
                      <Tooltip content="עצמאי חייב לדאוג לבד לכיסוי אובדן כושר עבודה. הפרמיה מוכרת 100% כהוצאה ומורידה את המס. עלות ממוצעת: ₪200–₪600 לחודש לפי גיל ושכר." />
                    </div>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₪</span>
                      <input
                        type="number"
                        value={input.disabilityInsuranceCost || ''}
                        onChange={e => updateInput({ disabilityInsuranceCost: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pr-10 text-white focus:outline-none focus:border-amber-500 transition-colors text-right"
                        dir="ltr"
                      />
                    </div>
                    {input.disabilityInsuranceCost > 0 && (
                      <div className="text-xs text-green-400/70">
                        ✓ מוכר כהוצאה — מוריד מהרווח החייב במס
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Settlement */}
            <Card>
              <SettlementSelect
                settlement={input.settlement}
                settlements={data.settlements}
                onChange={s => updateInput({ settlement: s })}
              />
            </Card>

            {/* Advanced */}
            <Card>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm text-white/50 hover:text-white transition-colors"
              >
                <span>אפשרויות נוספות</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <DisabilityInput
                    disability={input.disability}
                    onChange={d => updateInput({ disability: d })}
                  />
                  <div className="border-t border-white/10 pt-4">
                    <AdditionalOptions input={input} onChange={updateInput} />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right — results */}
          <div className="lg:col-span-2" id="results-section">
            <div className="lg:sticky lg:top-24">
              <div className="text-xs text-white/40 font-medium mb-3 text-center">תוצאות בזמן אמת</div>
              <ResultsPanel
                result={result}
                currentAge={input.age}
                retirementAge={input.retirementAge}
                pensionReturnRate={input.pensionReturnRate}
                existingPensionBalance={input.existingPensionBalance}
                onRetirementAgeChange={v => updateInput({ retirementAge: v })}
                onReturnRateChange={v => updateInput({ pensionReturnRate: v })}
                onExistingBalanceChange={v => updateInput({ existingPensionBalance: v })}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Mobile floating net bar */}
      {result && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe">
          <button
            onClick={() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold"
            style={{ background: 'rgba(10,10,20,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(245,197,24,0.2)' }}
          >
            <span className="text-white/50 text-xs">נטו לחודש</span>
            <span className="text-amber-400 text-xl font-black">₪{Math.round(result.netMonthly).toLocaleString('he-IL')}</span>
            <span className="text-white/40 text-xs">← ראה תוצאות</span>
          </button>
        </div>
      )}

      <footer className="mt-16 border-t border-white/5 py-8 mb-16 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-white/20 space-y-1">
          <p>ברוטו לנטו — מחשבון מיסוי ישראלי 2025</p>
          <p>החישובים מבוססים על נתוני רשות המסים ובטוח לאומי. לצרכי תכנון בלבד, אינו מהווה ייעוץ מס.</p>
        </div>
      </footer>
    </div>
  )
}

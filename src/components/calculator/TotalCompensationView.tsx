'use client'

import type { CalculatorResult } from '@/lib/types'
import { Tooltip } from '@/components/ui/Tooltip'

interface Props {
  result: CalculatorResult
}

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

export function TotalCompensationView({ result }: Props) {
  const ec = result.employerCost
  const sf = result.studyFund

  if (!ec) return null

  const employerPensionTotal = ec.pensionEmployer + ec.severancePay
  const totalAccruingMonthly = ec.totalAccruingMonthly + (result.deductions.pension.monthly ?? 0)

  return (
    <div className="space-y-4">

      {/* עלות מעסיק */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
        <div className="px-4 py-3 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-300">עלות מעסיק חודשית</span>
            <Tooltip content="כמה עולה העסקתך למעסיק בפועל — הרבה יותר מהשכר הנקוב!" />
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <CostRow label="שכר ברוטו" value={ec.grossSalary} />
          <CostRow label={`תגמולים מעסיק (${(6.5).toFixed(1)}%)`} value={ec.pensionEmployer} isAddition tooltip="הפרשת מעסיק לפנסיה — נצבר לך!" />
          <CostRow label="פיצויים (6%)" value={ec.severancePay} isAddition tooltip="נצבר בקרן הפנסיה שלך — שלך בפיטורים/התפטרות" />
          {ec.studyFundEmployer > 0 && (
            <CostRow label={`השתלמות מעסיק (${(7.5).toFixed(1)}%)`} value={ec.studyFundEmployer} isAddition tooltip="נצבר לך בקרן השתלמות" />
          )}
          <CostRow label="ביטוח לאומי מעסיק" value={ec.bituachLeumiEmployer} isAddition />
          <div className="border-t border-blue-500/20 pt-2.5 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-blue-200">עלות כוללת למעסיק</span>
              <span className="text-xl font-black text-blue-300">{fmt(ec.totalEmployerCost)}</span>
            </div>
            <div className="text-xs text-blue-400/60 mt-0.5 text-left">
              {fmt(ec.totalEmployerCost - ec.grossSalary)} מעבר לשכר הברוטו שלך
            </div>
          </div>
        </div>
      </div>

      {/* מה מגיע לידיך */}
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 overflow-hidden">
        <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20">
          <span className="text-sm font-bold text-green-300">מה מגיע לידיך</span>
        </div>
        <div className="p-4 space-y-2.5">
          <CostRow label="נטו בחשבון הבנק" value={result.netMonthly} highlight />
          <CostRow label="מס הכנסה" value={result.deductions.incomeTax.monthly} isDeduction />
          <CostRow label="ביטוח לאומי" value={result.deductions.bituachLeumi.monthly} isDeduction />
          <CostRow label="ביטוח בריאות" value={result.deductions.bituachBriut.monthly} isDeduction />
          <CostRow label="פנסיה עובד (6%)" value={result.deductions.pension.monthly} isDeduction tooltip="נכנס לחשבון הפנסיה שלך" />
          {result.deductions.studyFundEmployee && (
            <CostRow label="השתלמות עובד (2.5%)" value={result.deductions.studyFundEmployee.monthly} isDeduction tooltip="נכנס לקרן ההשתלמות שלך" />
          )}
        </div>
      </div>

      {/* מה נצבר */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-300">מה נצבר לטובתך</span>
            <Tooltip content="כסף שנצבר לך מדי חודש — אתה לא רואה אותו בחשבון הבנק אך הוא שלך לחלוטין!" />
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <CostRow label="פנסיה — עובד (6%)" value={result.deductions.pension.monthly} color="amber" />
          <CostRow label="פנסיה — מעסיק (6.5%)" value={ec.pensionEmployer} color="amber" />
          <CostRow label="פיצויים — מעסיק (6%)" value={ec.severancePay} color="amber" tooltip="שלך! נצבר ומוגן בחוק" />
          {sf && (
            <>
              <CostRow label="השתלמות עובד (2.5%)" value={sf.employeeContribution} color="amber" />
              <CostRow label="השתלמות מעסיק (7.5%)" value={sf.employerContribution} color="amber" />
            </>
          )}
          <div className="border-t border-amber-500/20 pt-2.5 mt-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-amber-200">נצבר חודשי</span>
              <span className="text-xl font-black text-amber-300">{fmt(totalAccruingMonthly + (sf ? sf.employerContribution : 0))}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-400/70">
              <span>נצבר שנתי</span>
              <span className="font-semibold">{fmt((totalAccruingMonthly + (sf ? sf.employerContribution : 0)) * 12)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* סיכום */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/40 mb-3 text-center">התמונה המלאה — חודשי</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-center">
          <SummaryBox label="עלות למעסיק" value={fmt(ec.totalEmployerCost)} color="blue" />
          <SummaryBox label="נטו לבנק" value={fmt(result.netMonthly)} color="green" />
          <SummaryBox label="נצבר לי" value={fmt(totalAccruingMonthly + (sf ? sf.employerContribution : 0))} color="amber" />
        </div>
      </div>
    </div>
  )
}

function CostRow({ label, value, isAddition, isDeduction, highlight, tooltip, color }: {
  label: string
  value: number
  isAddition?: boolean
  isDeduction?: boolean
  highlight?: boolean
  tooltip?: string
  color?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {isAddition && <span className="text-green-400 text-xs font-bold">+</span>}
        {isDeduction && <span className="text-red-400 text-xs font-bold">−</span>}
        <span className={`text-sm ${highlight ? 'text-green-300 font-bold' : 'text-white/70'}`}>{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <span className={`font-bold text-sm ${
        highlight ? 'text-green-300 text-base' :
        isAddition ? 'text-green-400' :
        isDeduction ? 'text-red-400/80' :
        color === 'amber' ? 'text-amber-400' :
        'text-white/80'
      }`}>
        {fmt(value)}
      </span>
    </div>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: 'blue' | 'green' | 'amber' }) {
  const styles = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    green: 'border-green-500/30 bg-green-500/10 text-green-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  }
  return (
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="font-black text-sm">{value}</div>
    </div>
  )
}

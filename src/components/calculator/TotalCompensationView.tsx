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
      <div className="rounded-2xl border border-blue-200 bg-blue-50 overflow-hidden">
        <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-700">עלות מעסיק חודשית</span>
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
          <div className="border-t border-blue-200 pt-2.5 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-blue-700">עלות כוללת למעסיק</span>
              <span className="text-xl font-black text-blue-700">{fmt(ec.totalEmployerCost)}</span>
            </div>
            <div className="text-xs text-blue-500 mt-0.5 text-left">
              {fmt(ec.totalEmployerCost - ec.grossSalary)} מעבר לשכר הברוטו שלך
            </div>
          </div>
        </div>
      </div>

      {/* מה מגיע לידיך */}
      <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
        <div className="px-4 py-3 bg-green-100 border-b border-green-200">
          <span className="text-sm font-bold text-green-700">מה מגיע לידיך</span>
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
      <div className="rounded-2xl border border-violet-200 bg-violet-50 overflow-hidden">
        <div className="px-4 py-3 bg-violet-100 border-b border-violet-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-violet-700">מה נצבר לטובתך</span>
            <Tooltip content="כסף שנצבר לך מדי חודש — אתה לא רואה אותו בחשבון הבנק אך הוא שלך לחלוטין!" />
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <CostRow label="פנסיה — עובד (6%)" value={result.deductions.pension.monthly} color="violet" />
          <CostRow label="פנסיה — מעסיק (6.5%)" value={ec.pensionEmployer} color="violet" />
          <CostRow label="פיצויים — מעסיק (6%)" value={ec.severancePay} color="violet" tooltip="שלך! נצבר ומוגן בחוק" />
          {sf && (
            <>
              <CostRow label="השתלמות עובד (2.5%)" value={sf.employeeContribution} color="violet" />
              <CostRow label="השתלמות מעסיק (7.5%)" value={sf.employerContribution} color="violet" />
            </>
          )}
          <div className="border-t border-violet-200 pt-2.5 mt-1 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-violet-700">נצבר חודשי</span>
              <span className="text-xl font-black text-violet-700">{fmt(totalAccruingMonthly + (sf ? sf.employerContribution : 0))}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-violet-500">
              <span>נצבר שנתי</span>
              <span className="font-semibold">{fmt((totalAccruingMonthly + (sf ? sf.employerContribution : 0)) * 12)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* סיכום */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-xs text-gray-400 mb-3 text-center">התמונה המלאה — חודשי</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-center">
          <SummaryBox label="עלות למעסיק" value={fmt(ec.totalEmployerCost)} color="blue" />
          <SummaryBox label="נטו לבנק" value={fmt(result.netMonthly)} color="green" />
          <SummaryBox label="נצבר לי" value={fmt(totalAccruingMonthly + (sf ? sf.employerContribution : 0))} color="violet" />
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
        {isAddition && <span className="text-green-600 text-xs font-bold">+</span>}
        {isDeduction && <span className="text-red-600 text-xs font-bold">−</span>}
        <span className={`text-sm ${highlight ? 'text-green-700 font-bold' : 'text-gray-600'}`}>{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <span className={`font-bold text-sm ${
        highlight ? 'text-green-700 text-base' :
        isAddition ? 'text-green-600' :
        isDeduction ? 'text-red-600' :
        color === 'violet' ? 'text-violet-700' :
        'text-gray-700'
      }`}>
        {fmt(value)}
      </span>
    </div>
  )
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: 'blue' | 'green' | 'violet' }) {
  const styles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700'
  }
  return (
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="font-black text-sm">{value}</div>
    </div>
  )
}

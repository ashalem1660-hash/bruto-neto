'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { CalculatorResult } from '@/lib/types'

interface Props {
  result: CalculatorResult
}

const fmt = (v: number) => Math.round(v)

export function ExportButtons({ result }: Props) {
  const [printing, setPrinting] = useState(false)

  // ─── EXCEL ───────────────────────────────────────────────
  function exportExcel() {
    const wb = XLSX.utils.book_new()
    const n = (v: number) => Math.round(v)

    // Sheet 1: סיכום
    const summaryRows = [
      ['ברוטו לנטו — דוח מס', '', ''],
      ['', '', ''],
      ['שדה', 'חודשי (₪)', 'שנתי (₪)'],
      ['הכנסה ברוטו', n(result.grossMonthly), n(result.grossAnnual)],
      ['', '', ''],
      ['ניכויים', '', ''],
      ['מס הכנסה', n(result.deductions.incomeTax.monthly), n(result.deductions.incomeTax.annual)],
      ['ביטוח לאומי', n(result.deductions.bituachLeumi.monthly), n(result.deductions.bituachLeumi.annual)],
      ['ביטוח בריאות', n(result.deductions.bituachBriut.monthly), n(result.deductions.bituachBriut.annual)],
      ['פנסיה (עובד)', n(result.deductions.pension.monthly), n(result.deductions.pension.annual)],
      ...(result.deductions.studyFundEmployee ? [
        ['קרן השתלמות (עובד)', n(result.deductions.studyFundEmployee.monthly), n(result.deductions.studyFundEmployee.annual)]
      ] : []),
      ['', '', ''],
      ['נטו לחשבון הבנק', n(result.netMonthly), n(result.netAnnual)],
      ['אחוז נטו מברוטו', `${Math.round(result.netPercent)}%`, ''],
      ['מס הכנסה אפקטיבי', `${Math.round((result.deductions.incomeTax.rate ?? 0) * 100)}%`, ''],
      ['', '', ''],
      ['נקודות זיכוי', result.creditPoints.toFixed(2), ''],
      ['שווי נקודות זיכוי חודשי', n(result.creditAmount / 12), n(result.creditAmount)],
    ]

    if (result.employerCost) {
      summaryRows.push(
        ['', '', ''],
        ['עלות מעסיק', '', ''],
        ['שכר ברוטו', n(result.employerCost.grossSalary), n(result.employerCost.grossSalary * 12)],
        ['פנסיה מעסיק (6.5%)', n(result.employerCost.pensionEmployer), n(result.employerCost.pensionEmployer * 12)],
        ['פיצויים (6%)', n(result.employerCost.severancePay), n(result.employerCost.severancePay * 12)],
        ['ביטוח לאומי מעסיק', n(result.employerCost.bituachLeumiEmployer), n(result.employerCost.bituachLeumiEmployer * 12)],
        ['עלות כוללת למעסיק', n(result.employerCost.totalEmployerCost), n(result.employerCost.totalEmployerCost * 12)],
      )
    }

    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)
    ws1['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'סיכום')

    // Sheet 2: מדרגות מס
    const bracketRows = [
      ['מדרגות מס הכנסה', '', '', '', ''],
      ['מדרגה', 'מ-₪ (שנתי)', 'עד-₪ (שנתי)', 'הכנסה במדרגה (שנתי)', 'מס (שנתי)'],
      ...result.taxBreakdown.map(b => [
        b.bracket,
        n(b.from),
        b.to !== null ? n(b.to) : 'ללא תקרה',
        b.isActive ? n(b.income) : 0,
        b.isActive ? n(b.tax) : 0,
      ])
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(bracketRows)
    ws2['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'מדרגות מס')

    // Sheet 3: נקודות זיכוי
    const creditRows = [
      ['נקודות זיכוי', '', ''],
      ['סוג זיכוי', 'נקודות', 'שווי חודשי (₪)'],
      ...result.creditBreakdown.map(c => [
        c.label, c.points, n(c.points * 242)
      ]),
      ['', '', ''],
      ['סה"כ', result.creditPoints.toFixed(2), n(result.creditAmount / 12)],
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(creditRows)
    ws3['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'נקודות זיכוי')

    XLSX.writeFile(wb, 'bruto-neto-report.xlsx')
  }

  // ─── PDF (print) ────────────────────────────────────────
  function exportPDF() {
    setPrinting(true)

    const el = document.getElementById('print-report')
    if (!el) { setPrinting(false); return }

    const n2 = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

    el.innerHTML = `
      <div class="print-title">ברוטו לנטו — דוח מס אישי</div>
      <div class="print-subtitle">הופק בתאריך ${new Date().toLocaleDateString('he-IL')} | bruto-neto-gray.vercel.app</div>

      <div class="print-grid-2">
        <div class="print-card">
          <div class="print-section-title">סיכום ראשי</div>
          <div class="print-row"><span class="print-label">הכנסה ברוטו</span><span class="print-value">${n2(result.grossMonthly)}/ח׳</span></div>
          <div class="print-row"><span class="print-label">נטו לחשבון הבנק</span><span class="print-value net">${n2(result.netMonthly)}/ח׳</span></div>
          <div class="print-row"><span class="print-label">נטו שנתי</span><span class="print-value net">${n2(result.netAnnual)}</span></div>
          <div class="print-row"><span class="print-label">אחוז נטו</span><span class="print-value accent">${Math.round(result.netPercent)}%</span></div>
          <div class="print-row"><span class="print-label">מס אפקטיבי</span><span class="print-value">${Math.round((result.deductions.incomeTax.rate ?? 0) * 100)}%</span></div>
        </div>

        <div class="print-card" style="text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center">
          <div style="font-size:12px;color:#888;margin-bottom:8px">נטו לחודש</div>
          <div class="print-big-number">${n2(result.netMonthly)}</div>
          <div style="font-size:12px;color:#888;margin-top:8px">${Math.round(result.netPercent)}% מהברוטו</div>
        </div>
      </div>

      <div class="print-card">
        <div class="print-section-title">פירוט ניכויים</div>
        <div class="print-grid-2">
          <div>
            <div class="print-row"><span class="print-label">מס הכנסה</span><span class="print-value deduction">${n2(result.deductions.incomeTax.monthly)}/ח׳</span></div>
            <div class="print-row"><span class="print-label">ביטוח לאומי</span><span class="print-value deduction">${n2(result.deductions.bituachLeumi.monthly)}/ח׳</span></div>
            <div class="print-row"><span class="print-label">ביטוח בריאות</span><span class="print-value deduction">${n2(result.deductions.bituachBriut.monthly)}/ח׳</span></div>
          </div>
          <div>
            <div class="print-row"><span class="print-label">פנסיה (עובד)</span><span class="print-value deduction">${n2(result.deductions.pension.monthly)}/ח׳</span></div>
            ${result.deductions.studyFundEmployee ? `<div class="print-row"><span class="print-label">קרן השתלמות</span><span class="print-value deduction">${n2(result.deductions.studyFundEmployee.monthly)}/ח׳</span></div>` : ''}
            <div class="print-row"><span class="print-label">סה"כ ניכויים שנתי</span><span class="print-value deduction">${n2((result.grossMonthly - result.netMonthly) * 12)}</span></div>
          </div>
        </div>
      </div>

      <div class="print-card">
        <div class="print-section-title">מדרגות מס הכנסה</div>
        ${result.taxBreakdown.map(b => `
          <div class="print-row" style="${!b.isActive ? 'opacity:0.4' : ''}">
            <span class="print-label">${b.bracket} (${fmt(b.from / 12).toLocaleString('he-IL')}–${b.to !== null ? fmt(b.to / 12).toLocaleString('he-IL') : '∞'} לחודש)</span>
            <span class="print-value ${b.isActive ? '' : 'deduction'}">${b.isActive ? `${n2(b.tax / 12)}/ח׳` : '—'}</span>
          </div>`).join('')}
        ${result.creditAmount > 0 ? `<div class="print-row" style="color:#16a34a"><span class="print-label">זיכוי נקודות (${result.creditPoints.toFixed(2)} נק׳)</span><span class="print-value" style="color:#16a34a">−${n2(result.creditAmount / 12)}/ח׳</span></div>` : ''}
      </div>

      ${result.creditBreakdown.length > 0 ? `
      <div class="print-card">
        <div class="print-section-title">נקודות זיכוי — סה"כ ${result.creditPoints.toFixed(2)} נק׳ = ${n2(result.creditAmount / 12)}/ח׳</div>
        ${result.creditBreakdown.map(c => `
          <div class="print-row">
            <span class="print-label">${c.label}</span>
            <span class="print-value accent">${c.points} נק׳ = ${n2(c.points * 242)}/ח׳</span>
          </div>`).join('')}
      </div>` : ''}

      ${result.employerCost ? `
      <div class="print-card">
        <div class="print-section-title">עלות מעסיק חודשית</div>
        <div class="print-row"><span class="print-label">שכר ברוטו</span><span class="print-value">${n2(result.employerCost.grossSalary)}</span></div>
        <div class="print-row"><span class="print-label">פנסיה מעסיק (6.5%)</span><span class="print-value">${n2(result.employerCost.pensionEmployer)}</span></div>
        <div class="print-row"><span class="print-label">פיצויים (6%)</span><span class="print-value">${n2(result.employerCost.severancePay)}</span></div>
        <div class="print-row"><span class="print-label">ביטוח לאומי מעסיק</span><span class="print-value">${n2(result.employerCost.bituachLeumiEmployer)}</span></div>
        <div class="print-row" style="font-weight:bold"><span class="print-label">עלות כוללת</span><span class="print-value accent">${n2(result.employerCost.totalEmployerCost)}</span></div>
      </div>` : ''}

      <div class="print-footer">ברוטו לנטו — מחשבון מיסוי ישראלי 2025 | החישובים לצרכי תכנון בלבד, אינם מהווים ייעוץ מס</div>
    `

    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 100)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportExcel}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
      >
        <span>📊</span>
        <span>Excel</span>
      </button>
      <button
        onClick={exportPDF}
        disabled={printing}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
      >
        <span>📄</span>
        <span>{printing ? 'מכין...' : 'PDF'}</span>
      </button>
    </div>
  )
}

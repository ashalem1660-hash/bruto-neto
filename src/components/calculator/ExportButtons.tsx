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

    const m = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`
    const totalDeductions = result.grossMonthly - result.netMonthly
    const netPercent = Math.round(result.netPercent)
    const taxPercent = Math.round((result.deductions.incomeTax.rate ?? 0) * 100)

    // Deduction rows for the breakdown section
    const deductionItems = [
      { label: 'מס הכנסה', value: result.deductions.incomeTax.monthly, color: '#DC2626' },
      { label: 'ביטוח לאומי', value: result.deductions.bituachLeumi.monthly, color: '#EA580C' },
      { label: 'ביטוח בריאות', value: result.deductions.bituachBriut.monthly, color: '#D97706' },
      { label: 'פנסיה (עובד)', value: result.deductions.pension.monthly, color: '#7C3AED' },
      ...(result.deductions.studyFundEmployee ? [{ label: 'קרן השתלמות', value: result.deductions.studyFundEmployee.monthly, color: '#2563EB' }] : []),
    ]

    const deductionRows = deductionItems.map(item => {
      const pct = result.grossMonthly > 0 ? Math.round((item.value / result.grossMonthly) * 100) : 0
      const barPct = totalDeductions > 0 ? Math.round((item.value / totalDeductions) * 100) : 0
      return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #F3F4F6">
        <div style="flex:1;font-size:12px;color:#374151">${item.label}</div>
        <div style="width:120px;background:#F3F4F6;border-radius:3px;height:6px;overflow:hidden">
          <div style="height:100%;width:${barPct}%;background:${item.color};border-radius:3px"></div>
        </div>
        <div style="width:80px;text-align:left;font-size:12px;font-weight:700;color:${item.color}">${m(item.value)}/ח׳</div>
        <div style="width:36px;text-align:left;font-size:11px;color:#9CA3AF">${pct}%</div>
      </div>`
    }).join('')

    const taxBracketRows = result.taxBreakdown.map(b => {
      const isActive = b.isActive
      return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F9FAFB;opacity:${isActive ? 1 : 0.35}">
        <span style="font-size:12px;color:#374151">${b.bracket}
          <span style="font-size:10px;color:#9CA3AF;margin-right:4px">(${fmt(b.from / 12).toLocaleString('he-IL')}–${b.to !== null ? fmt(b.to / 12).toLocaleString('he-IL') : '∞'} לחודש)</span>
        </span>
        <span style="font-size:12px;font-weight:700;color:${isActive ? '#DC2626' : '#9CA3AF'}">${isActive ? `${m(b.tax / 12)}/ח׳` : '—'}</span>
      </div>`
    }).join('')

    el.innerHTML = `
      <div style="direction:rtl;font-family:Heebo,Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#111827">

        <!-- Cover header -->
        <div style="background:linear-gradient(135deg,#7C3AED 0%,#4338CA 100%);border-radius:16px;padding:24px 28px;color:white;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:10px;font-weight:700;opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">ברוטו לנטו • ${new Date().toLocaleDateString('he-IL')}</div>
            <div style="font-size:26px;font-weight:900;margin-bottom:4px">דוח מס אישי</div>
            <div style="font-size:13px;opacity:0.8">חישוב מפורט — מס, ניכויים, נטו</div>
          </div>
          <div style="text-align:center;background:rgba(255,255,255,0.15);border-radius:14px;padding:16px 22px">
            <div style="font-size:11px;opacity:0.75;margin-bottom:4px">נטו לחודש</div>
            <div style="font-size:32px;font-weight:900">${m(result.netMonthly)}</div>
            <div style="font-size:12px;opacity:0.8;margin-top:4px">${netPercent}% מהברוטו</div>
          </div>
        </div>

        <!-- Summary row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
          ${[
            { label: 'ברוטו חודשי', value: m(result.grossMonthly), color: '#374151', bg: '#F8FAFC' },
            { label: 'נטו חודשי', value: m(result.netMonthly), color: '#16A34A', bg: '#F0FDF4' },
            { label: 'נטו שנתי', value: m(result.netAnnual), color: '#16A34A', bg: '#F0FDF4' },
            { label: 'מס אפקטיבי', value: `${taxPercent}%`, color: '#DC2626', bg: '#FEF2F2' },
          ].map(item => `
            <div style="background:${item.bg};border-radius:12px;padding:12px 14px;text-align:center">
              <div style="font-size:10px;color:#6B7280;margin-bottom:4px">${item.label}</div>
              <div style="font-size:16px;font-weight:900;color:${item.color}">${item.value}</div>
            </div>`).join('')}
        </div>

        <!-- Where does your money go? -->
        <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px;margin-bottom:14px">
          <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #7C3AED">לאן הולך הכסף? — ניתוח ניכויים חודשי</div>
          ${deductionRows}
          <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:4px;border-top:2px solid #E5E7EB">
            <span style="font-size:13px;font-weight:800;color:#111827">נטו לחשבון הבנק</span>
            <span style="font-size:15px;font-weight:900;color:#16A34A">${m(result.netMonthly)}/ח׳</span>
          </div>
        </div>

        <!-- Tax brackets + credit points -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px">
            <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #7C3AED">מדרגות מס הכנסה</div>
            ${taxBracketRows}
            ${result.creditAmount > 0 ? `
              <div style="display:flex;justify-content:space-between;padding:6px 0;margin-top:4px;border-top:2px solid #DCFCE7">
                <span style="font-size:12px;color:#166534;font-weight:700">זיכוי נקודות (${result.creditPoints.toFixed(2)} נק׳)</span>
                <span style="font-size:12px;font-weight:900;color:#16A34A">−${m(result.creditAmount / 12)}/ח׳</span>
              </div>` : ''}
          </div>

          ${result.creditBreakdown.length > 0 ? `
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px">
            <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #7C3AED">נקודות זיכוי — ${result.creditPoints.toFixed(2)} נק׳</div>
            ${result.creditBreakdown.map(c => `
              <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F3F4F6;font-size:12px">
                <span style="color:#374151">${c.label}</span>
                <span style="font-weight:700;color:#7C3AED">${c.points} נק׳ = ${m(c.points * 242)}/ח׳</span>
              </div>`).join('')}
            <div style="display:flex;justify-content:space-between;padding:8px 0 0;margin-top:4px;border-top:2px solid #EDE9FE;font-size:12px">
              <span style="font-weight:800;color:#5B21B6">סה"כ</span>
              <span style="font-weight:900;color:#7C3AED">${result.creditPoints.toFixed(2)} נק׳ = ${m(result.creditAmount / 12)}/ח׳</span>
            </div>
          </div>` : `<div></div>`}
        </div>

        ${result.employerCost ? `
        <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:14px;padding:16px 18px;margin-bottom:14px">
          <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #7C3AED">עלות מעסיק חודשית</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
            ${[
              { label: 'שכר ברוטו', value: m(result.employerCost.grossSalary), color: '#374151' },
              { label: 'פנסיה מעסיק (6.5%)', value: m(result.employerCost.pensionEmployer), color: '#7C3AED' },
              { label: 'פיצויים (6%)', value: m(result.employerCost.severancePay), color: '#7C3AED' },
              { label: 'ב"ל מעסיק', value: m(result.employerCost.bituachLeumiEmployer), color: '#EA580C' },
              { label: 'עלות כוללת', value: m(result.employerCost.totalEmployerCost), color: '#111827' },
            ].map(item => `
              <div style="background:white;border-radius:10px;padding:10px 12px;border:1px solid #E5E7EB">
                <div style="font-size:10px;color:#6B7280;margin-bottom:3px">${item.label}</div>
                <div style="font-size:14px;font-weight:800;color:${item.color}">${item.value}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <div style="text-align:center;font-size:10px;color:#94A3B8;padding-top:12px;border-top:1px solid #F1F5F9">
          ברוטו לנטו — מחשבון מיסוי ישראלי 2025 | החישובים לצרכי תכנון בלבד, אינם מהווים ייעוץ מס
        </div>
      </div>
    `

    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 150)
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

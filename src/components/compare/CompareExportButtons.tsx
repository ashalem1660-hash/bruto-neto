'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import type { JobOffer, OfferResult, PersonalProfile } from '@/lib/compare-types'

interface Props {
  offers: JobOffer[]
  results: OfferResult[]
  profile: PersonalProfile
}

const fmtNum = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

const HTML_COLORS: Record<string, { bg: string; text: string; accent: string; light: string; border: string }> = {
  violet: { bg: '#EDE9FE', text: '#5B21B6', accent: '#7C3AED', light: '#F5F3FF', border: '#C4B5FD' },
  green:  { bg: '#DCFCE7', text: '#166534', accent: '#16A34A', light: '#F0FDF4', border: '#86EFAC' },
  blue:   { bg: '#DBEAFE', text: '#1E40AF', accent: '#2563EB', light: '#EFF6FF', border: '#93C5FD' },
  orange: { bg: '#FED7AA', text: '#9A3412', accent: '#EA580C', light: '#FFF7ED', border: '#FDBA74' },
}

export function CompareExportButtons({ offers, results, profile }: Props) {
  const [printing, setPrinting] = useState(false)

  // ─── EXCEL ────────────────────────────────────────────────────────────────
  function exportExcel() {
    const wb = XLSX.utils.book_new()
    const offerNames = offers.map((o, i) => o.name || `הצעה ${i + 1}`)
    const bestTotal = Math.max(...results.map(r => r.totalWithSavingsAnnual))
    const winnerIdx = results.findIndex(r => r.totalWithSavingsAnnual === bestTotal)

    function bestMark(vals: number[]): string[] {
      const max = Math.max(...vals)
      return vals.map(v => v > 0 && v === max ? `★ ${fmtNum(v)}` : v > 0 ? fmtNum(v) : '—')
    }

    const headers = ['קטגוריה', ...offerNames.map((n, i) => i === winnerIdx ? `🏆 ${n}` : n)]

    const rows: (string | number)[][] = [
      ['ברוטו לנטו — השוואת הצעות עבודה'],
      [`הופק: ${new Date().toLocaleDateString('he-IL')}`],
      [],
      headers,
      [],
      ['💰 שכר נטו', ...Array(offers.length).fill('')],
      ['שכר ברוטו חודשי', ...offers.map(o => fmtNum(o.grossSalary))],
      ['נטו חודשי ★', ...bestMark(results.map(r => r.netSalaryMonthly))],
      ['נטו שנתי', ...bestMark(results.map(r => r.netSalaryAnnual))],
      ['מס אפקטיבי', ...results.map(r => `${Math.round(r.effectiveTaxRate * 100)}%`)],
    ]

    if (results.some(r => r.annualBonusGross > 0)) {
      rows.push(
        [],
        ['🎁 בונוס', ...Array(offers.length).fill('')],
        ['בונוס שנתי ברוטו', ...bestMark(results.map(r => r.annualBonusGross))],
        ['בונוס שנתי נטו ★', ...bestMark(results.map(r => r.annualBonusNet))],
      )
    }

    if (results.some(r => r.annualEquityGross > 0)) {
      rows.push(
        [],
        ['📈 הון ומניות', ...Array(offers.length).fill('')],
        ['RSU + אופציות ברוטו', ...bestMark(results.map(r => r.annualEquityGross))],
        ['RSU + אופציות נטו ★', ...bestMark(results.map(r => r.annualEquityNet))],
      )
    }

    rows.push([], ['✨ הטבות פטורות ממס (שנתי)', ...Array(offers.length).fill('')])
    const perks: [string, (r: OfferResult) => number][] = [
      ['סיבוס', r => r.taxFreePerks.cibus],
      ['ארוחות במשרד', r => r.taxFreePerks.officeMeals],
      ['ביטוח בריאות', r => r.taxFreePerks.healthInsurance],
      ['רווחה', r => r.taxFreePerks.welfare],
      ['חנייה', r => r.taxFreePerks.parking],
      ['נסיעות', r => r.taxFreePerks.transportation],
      ['ספורט', r => r.taxFreePerks.gym],
      ['הכשרות', r => r.taxFreePerks.training],
      ['ציוד', r => r.taxFreePerks.equipment],
      ['טלפון', r => r.taxFreePerks.phone],
      ['גן ילדים', r => r.taxFreePerks.childcare],
      ['ימי חופש נוספים (ערך)', r => r.taxFreePerks.extraVacation],
    ]
    for (const [label, getter] of perks) {
      const vals = results.map(getter)
      if (vals.some(v => v > 0)) rows.push([label, ...bestMark(vals)])
    }
    rows.push(['סה"כ הטבות שנתי ★', ...bestMark(results.map(r => r.taxFreePerksTotal))])

    rows.push(
      [],
      ['🏦 חיסכון נצבר שנתי', ...Array(offers.length).fill('')],
      ['פנסיה (עובד + מעסיק + פיצויים)', ...bestMark(results.map(r => r.annualPensionAccrual))],
      ['קרן השתלמות (עובד + מעסיק)', ...bestMark(results.map(r => r.annualStudyFundAccrual))],
      ['סה"כ חיסכון ★', ...bestMark(results.map(r => r.annualPensionAccrual + r.annualStudyFundAccrual))],
      [],
      ['🏆 סיכום כולל שנתי', ...Array(offers.length).fill('')],
      ['שכר + בונוס + אקוויטי + הטבות ★', ...bestMark(results.map(r => r.totalLiquidAnnual))],
      ['כולל חיסכון פנסיה + השתלמות ★★', ...bestMark(results.map(r => r.totalWithSavingsAnnual))],
    )

    if (results.some(r => r.signOnBonus > 0)) {
      rows.push(
        [],
        ['⚡ חד פעמי', ...Array(offers.length).fill('')],
        ['Sign-on bonus', ...offers.map(o => o.signOnBonus > 0 ? fmtNum(o.signOnBonus) : '—')],
      )
    }

    if (offers.some(o => o.wfhDaysPerWeek > 0)) {
      rows.push(
        [],
        ['🏠 גמישות', ...Array(offers.length).fill('')],
        ['ימי WFH בשבוע', ...offers.map(o => `${o.wfhDaysPerWeek} ימים`)],
        ['שעות גמישות', ...offers.map(o => o.flexibleHours ? '✓ כן' : 'לא')],
      )
    }

    const ws1 = XLSX.utils.aoa_to_sheet(rows)
    ws1['!cols'] = [{ wch: 36 }, ...offers.map(() => ({ wch: 24 }))]
    XLSX.utils.book_append_sheet(wb, ws1, 'השוואה')

    // Sheet 2: Personal profile
    const profileRows: (string | number | boolean)[][] = [
      ['פרופיל אישי', ''],
      ['מגדר', profile.gender === 'male' ? 'זכר' : 'נקבה'],
      ['גיל', profile.age],
      ['מצב משפחתי', ({ single: 'רווק/ה', married: 'נשוי/אה', divorced: 'גרוש/ה', widowed: 'אלמן/ה' } as Record<string, string>)[profile.maritalStatus]],
      ['ילדים', profile.childrenCount],
      ['הורה יחיד', profile.isSingleParent ? 'כן' : 'לא'],
      ...(profile.creditPointsOverride != null ? [['נקודות זיכוי (ידני)', profile.creditPointsOverride]] : [] as (string | number)[][]),
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(profileRows)
    ws2['!cols'] = [{ wch: 24 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'פרופיל אישי')

    // One sheet per offer
    offers.forEach((offer, i) => {
      const r = results[i]
      const offerRows: (string | number)[][] = [
        [`${offer.name || `הצעה ${i + 1}`} — פירוט מלא`, ''],
        [],
        ['שכר', ''],
        ['שכר ברוטו חודשי', fmtNum(offer.grossSalary)],
        ['נטו חודשי', fmtNum(r.netSalaryMonthly)],
        ['נטו שנתי', fmtNum(r.netSalaryAnnual)],
        ['מס אפקטיבי', `${Math.round(r.effectiveTaxRate * 100)}%`],
        [],
        ['פנסיה', ''],
        ['שיעור מעסיק', `${offer.pensionEmployerRate}%`],
        ['שיעור עובד', `${offer.pensionEmployeeRate}%`],
        ['חיסכון פנסיה שנתי', fmtNum(r.annualPensionAccrual)],
        [],
        ['קרן השתלמות', ''],
        ['יש קרן', offer.hasStudyFund ? 'כן' : 'לא'],
        ...(offer.hasStudyFund ? [
          ['שיעור מעסיק', `${offer.studyFundEmployerRate}%`],
          ['שיעור עובד', `${offer.studyFundEmployeeRate}%`],
          ['חיסכון קה"ש שנתי', fmtNum(r.annualStudyFundAccrual)],
        ] : []),
        [],
        ['הטבות', ''],
        ...(offer.cibusPerDay > 0 ? [['סיבוס יומי', fmtNum(offer.cibusPerDay)]] : []),
        ...(offer.officeMeals ? [['ארוחות במשרד', `${offer.officeMealsPerDay} ארוחות/יום`]] : []),
        ...(offer.healthInsuranceMonthly > 0 ? [['ביטוח בריאות', `${fmtNum(offer.healthInsuranceMonthly)}/ח׳`]] : []),
        ...(offer.welfareAnnualBudget > 0 ? [['רווחה שנתי', fmtNum(offer.welfareAnnualBudget)]] : []),
        ...(offer.parkingMonthly > 0 ? [['חנייה', `${fmtNum(offer.parkingMonthly)}/ח׳`]] : []),
        ...(offer.transportationMonthly > 0 ? [['נסיעות', `${fmtNum(offer.transportationMonthly)}/ח׳`]] : []),
        ...(offer.gymMonthly > 0 ? [['ספורט', `${fmtNum(offer.gymMonthly)}/ח׳`]] : []),
        ...(offer.trainingAnnual > 0 ? [['הכשרות שנתי', fmtNum(offer.trainingAnnual)]] : []),
        ...(offer.equipmentAnnual > 0 ? [['ציוד שנתי', fmtNum(offer.equipmentAnnual)]] : []),
        ...(offer.phoneMonthly > 0 ? [['טלפון', `${fmtNum(offer.phoneMonthly)}/ח׳`]] : []),
        ...(offer.childcareMonthly > 0 ? [['גן ילדים', `${fmtNum(offer.childcareMonthly)}/ח׳`]] : []),
        ...(offer.vacationDays > 12 ? [['ימי חופש נוספים', `${offer.vacationDays - 12} ימים`]] : []),
        [],
        ['סיכום', ''],
        ['סה"כ הטבות שנתי', fmtNum(r.taxFreePerksTotal)],
        ['סה"כ חיסכון שנתי', fmtNum(r.annualPensionAccrual + r.annualStudyFundAccrual)],
        ['סה"כ נזיל שנתי', fmtNum(r.totalLiquidAnnual)],
        ['סה"כ כולל חיסכון ★', fmtNum(r.totalWithSavingsAnnual)],
      ]
      const ws = XLSX.utils.aoa_to_sheet(offerRows)
      ws['!cols'] = [{ wch: 28 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, ws, (offer.name || `הצעה ${i + 1}`).slice(0, 31))
    })

    XLSX.writeFile(wb, 'השוואת-הצעות.xlsx')
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────
  function exportPDF() {
    setPrinting(true)
    const el = document.getElementById('print-compare')
    if (!el) { setPrinting(false); return }

    const bestTotal = Math.max(...results.map(r => r.totalWithSavingsAnnual))
    const winnerIdx = results.findIndex(r => r.totalWithSavingsAnnual === bestTotal)
    const winner = offers[winnerIdx]
    const colors = offers.map(o => HTML_COLORS[o.color] || HTML_COLORS.violet)

    function tableRow(label: string, vals: number[], isMoney = true, bold = false): string {
      const max = Math.max(...vals)
      const cells = vals.map((val, i) => {
        const c = colors[i]
        const isMax = val === max && max > 0
        const barPct = max > 0 ? Math.round((val / max) * 100) : 0
        if (!val) return `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid #F3F4F6"><span style="color:#D1D5DB">—</span></td>`
        const display = isMoney ? fmtNum(val) : `${Math.round(val * 100)}%`
        return `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid #F3F4F6;background:${isMax ? c.light : 'transparent'}">
          <div style="font-size:${bold ? '14px' : '12px'};font-weight:${isMax ? 900 : bold ? 700 : 500};color:${isMax ? c.accent : '#374151'}">${display}${isMax ? ' ★' : ''}</div>
          ${isMoney && max > 0 ? `<div style="height:3px;background:#E9ECEF;border-radius:2px;margin-top:3px;overflow:hidden"><div style="height:100%;width:${barPct}%;background:${isMax ? c.accent : '#ADB5BD'};border-radius:2px"></div></div>` : ''}
        </td>`
      }).join('')
      return `<tr>
        <td style="padding:6px 10px 6px 6px;border-bottom:1px solid #F3F4F6;font-size:${bold ? '13px' : '12px'};color:${bold ? '#111827' : '#6B7280'};font-weight:${bold ? 700 : 400}">${label}</td>
        ${cells}
      </tr>`
    }

    function sectionHead(label: string): string {
      return `<tr><td colspan="${offers.length + 1}" style="padding:8px 10px 5px;background:#F8FAFC;font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:0.08em;border-top:2px solid #E2E8F0;border-bottom:1px solid #E2E8F0">${label}</td></tr>`
    }

    // Offer header columns
    const offerHeaders = offers.map((o, i) => {
      const c = colors[i]
      const r = results[i]
      const isWinner = i === winnerIdx
      return `<th style="padding:12px 8px;text-align:center;min-width:120px;background:${c.bg};border-bottom:3px solid ${c.accent}">
        ${isWinner ? `<div style="font-size:9px;font-weight:800;color:${c.text};letter-spacing:0.05em;margin-bottom:3px">🏆 מנצח</div>` : ''}
        <div style="font-size:13px;font-weight:900;color:${c.text}">${o.name || `הצעה ${i + 1}`}</div>
        <div style="font-size:11px;color:${c.accent};margin-top:3px;font-weight:700">${fmtNum(o.grossSalary)}/ח׳ ברוטו</div>
        <div style="font-size:12px;color:${c.text};margin-top:2px;font-weight:800">נטו: ${fmtNum(r.netSalaryMonthly)}/ח׳</div>
      </th>`
    }).join('')

    // Build table body
    let tbody = ''

    tbody += sectionHead('💰 שכר נטו')
    tbody += tableRow('נטו חודשי', results.map(r => r.netSalaryMonthly), true, true)
    tbody += tableRow('נטו שנתי', results.map(r => r.netSalaryAnnual))
    tbody += tableRow('מס אפקטיבי', results.map(r => r.effectiveTaxRate), false)

    if (results.some(r => r.annualBonusGross > 0)) {
      tbody += sectionHead('🎁 בונוס')
      tbody += tableRow('בונוס שנתי ברוטו', results.map(r => r.annualBonusGross))
      tbody += tableRow('בונוס שנתי נטו', results.map(r => r.annualBonusNet), true, true)
    }

    if (results.some(r => r.annualEquityGross > 0)) {
      tbody += sectionHead('📈 הון ומניות')
      tbody += tableRow('RSU + אופציות שנתי ברוטו', results.map(r => r.annualEquityGross))
      tbody += tableRow('RSU + אופציות שנתי נטו', results.map(r => r.annualEquityNet), true, true)
    }

    tbody += sectionHead('✨ הטבות פטורות ממס (שנתי)')
    if (results.some(r => r.taxFreePerks.cibus > 0)) tbody += tableRow('סיבוס', results.map(r => r.taxFreePerks.cibus))
    if (results.some(r => r.taxFreePerks.officeMeals > 0)) tbody += tableRow('ארוחות', results.map(r => r.taxFreePerks.officeMeals))
    if (results.some(r => r.taxFreePerks.healthInsurance > 0)) tbody += tableRow('ביטוח בריאות', results.map(r => r.taxFreePerks.healthInsurance))
    if (results.some(r => r.taxFreePerks.welfare > 0)) tbody += tableRow('רווחה', results.map(r => r.taxFreePerks.welfare))
    if (results.some(r => r.taxFreePerks.parking > 0)) tbody += tableRow('חנייה', results.map(r => r.taxFreePerks.parking))
    if (results.some(r => r.taxFreePerks.transportation > 0)) tbody += tableRow('נסיעות', results.map(r => r.taxFreePerks.transportation))
    if (results.some(r => r.taxFreePerks.gym > 0)) tbody += tableRow('ספורט', results.map(r => r.taxFreePerks.gym))
    if (results.some(r => r.taxFreePerks.training > 0)) tbody += tableRow('הכשרות', results.map(r => r.taxFreePerks.training))
    if (results.some(r => r.taxFreePerks.equipment > 0)) tbody += tableRow('ציוד', results.map(r => r.taxFreePerks.equipment))
    if (results.some(r => r.taxFreePerks.phone > 0)) tbody += tableRow('טלפון', results.map(r => r.taxFreePerks.phone))
    if (results.some(r => r.taxFreePerks.childcare > 0)) tbody += tableRow('גן ילדים', results.map(r => r.taxFreePerks.childcare))
    if (results.some(r => r.taxFreePerks.extraVacation > 0)) tbody += tableRow('ימי חופש נוספים', results.map(r => r.taxFreePerks.extraVacation))
    tbody += tableRow('סה"כ הטבות', results.map(r => r.taxFreePerksTotal), true, true)

    tbody += sectionHead('🏦 חיסכון נצבר שנתי')
    tbody += tableRow('פנסיה (עובד + מעסיק + פיצויים)', results.map(r => r.annualPensionAccrual))
    tbody += tableRow('קרן השתלמות (עובד + מעסיק)', results.map(r => r.annualStudyFundAccrual))
    tbody += tableRow('סה"כ חיסכון', results.map(r => r.annualPensionAccrual + r.annualStudyFundAccrual), true, true)

    // Highlight summary rows
    tbody += sectionHead('🏆 סיכום כולל שנתי')
    const liquidVals = results.map(r => r.totalLiquidAnnual)
    const totalVals = results.map(r => r.totalWithSavingsAnnual)
    const liquidMax = Math.max(...liquidVals)
    const totalMax = Math.max(...totalVals)

    const liquidCells = liquidVals.map((val, i) => {
      const c = colors[i]
      const isMax = val === liquidMax && liquidMax > 0
      const pct = liquidMax > 0 ? Math.round((val / liquidMax) * 100) : 0
      return `<td style="text-align:center;padding:8px;background:${isMax ? c.light : '#FAFAFA'};border-bottom:1px solid #E5E7EB">
        <div style="font-size:14px;font-weight:800;color:${isMax ? c.accent : '#374151'}">${fmtNum(val)}${isMax ? ' ★' : ''}</div>
        <div style="height:4px;background:#E5E7EB;border-radius:2px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${c.accent};border-radius:2px"></div></div>
      </td>`
    }).join('')
    tbody += `<tr><td style="padding:8px 10px;font-size:13px;font-weight:700;background:#FAFAFA;color:#374151;border-bottom:1px solid #E5E7EB">שכר + בונוס + אקוויטי + הטבות</td>${liquidCells}</tr>`

    const totalCells = totalVals.map((val, i) => {
      const c = colors[i]
      const isMax = val === totalMax && totalMax > 0
      const pct = totalMax > 0 ? Math.round((val / totalMax) * 100) : 0
      return `<td style="text-align:center;padding:12px 8px;background:${isMax ? c.bg : '#F9FAFB'};border-bottom:2px solid ${isMax ? c.accent : '#E5E7EB'}">
        <div style="font-size:18px;font-weight:900;color:${isMax ? c.accent : '#374151'}">${fmtNum(val)}${isMax ? ' ★' : ''}</div>
        <div style="height:5px;background:#E5E7EB;border-radius:3px;margin-top:5px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${c.accent};border-radius:3px"></div></div>
      </td>`
    }).join('')
    tbody += `<tr><td style="padding:12px 10px;font-size:14px;font-weight:900;color:#111827;border-top:2px solid #E2E8F0">כולל חיסכון פנסיה + השתלמות</td>${totalCells}</tr>`

    if (results.some(r => r.signOnBonus > 0)) {
      tbody += sectionHead('⚡ חד פעמי')
      tbody += tableRow('Sign-on bonus', results.map(r => r.signOnBonus))
    }

    if (offers.some(o => o.wfhDaysPerWeek > 0)) {
      tbody += sectionHead('🏠 גמישות')
      const wfhMax = Math.max(...offers.map(o => o.wfhDaysPerWeek))
      const wfhCells = offers.map((o, i) => {
        const c = colors[i]
        const isMax = o.wfhDaysPerWeek === wfhMax && wfhMax > 0
        return `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid #F3F4F6">
          <span style="font-size:12px;font-weight:${isMax ? 800 : 400};color:${isMax ? c.accent : '#6B7280'}">${o.wfhDaysPerWeek} ימים${isMax ? ' ★' : ''}</span>
        </td>`
      }).join('')
      tbody += `<tr><td style="padding:6px 10px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6">ימי WFH בשבוע</td>${wfhCells}</tr>`
      const flexCells = offers.map(o => `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:12px;color:${o.flexibleHours ? '#16A34A' : '#9CA3AF'}">${o.flexibleHours ? '✓ כן' : '—'}</td>`).join('')
      tbody += `<tr><td style="padding:6px 10px;font-size:12px;color:#6B7280;border-bottom:1px solid #F3F4F6">שעות גמישות</td>${flexCells}</tr>`
    }

    // Offer summary mini cards
    const summaryCards = offers.map((o, i) => {
      const r = results[i]
      const c = colors[i]
      const isWinner = i === winnerIdx
      const totalPct = totalMax > 0 ? Math.round((r.totalWithSavingsAnnual / totalMax) * 100) : 0
      return `<div style="flex:1;min-width:130px;border-radius:14px;padding:14px 12px;background:${c.bg};border:${isWinner ? `2px solid ${c.accent}` : `1px solid ${c.border}`};break-inside:avoid">
        ${isWinner ? `<div style="font-size:9px;font-weight:800;color:${c.accent};letter-spacing:0.08em;margin-bottom:4px">🏆 מנצח</div>` : `<div style="height:13px"></div>`}
        <div style="font-size:14px;font-weight:900;color:${c.text};margin-bottom:8px">${o.name || `הצעה ${i + 1}`}</div>
        <div style="font-size:10px;color:${c.text};opacity:0.65;margin-bottom:1px">ברוטו חודשי</div>
        <div style="font-size:16px;font-weight:800;color:${c.accent};margin-bottom:6px">${fmtNum(o.grossSalary)}</div>
        <div style="font-size:10px;color:${c.text};opacity:0.65;margin-bottom:1px">נטו חודשי</div>
        <div style="font-size:13px;font-weight:700;color:${c.text};margin-bottom:8px">${fmtNum(r.netSalaryMonthly)}</div>
        <div style="height:1px;background:${c.border};margin:6px 0"></div>
        <div style="font-size:10px;color:${c.text};opacity:0.65;margin-bottom:2px">ערך שנתי כולל</div>
        <div style="font-size:13px;font-weight:900;color:${c.text};margin-bottom:5px">${fmtNum(r.totalWithSavingsAnnual)}</div>
        <div style="height:4px;background:rgba(0,0,0,0.1);border-radius:2px;overflow:hidden"><div style="height:100%;width:${totalPct}%;background:${c.accent};border-radius:2px"></div></div>
      </div>`
    }).join('')

    el.innerHTML = `
      <div style="direction:rtl;font-family:Heebo,Arial,sans-serif;max-width:900px;margin:0 auto;padding:16px;color:#111827">

        <!-- Cover -->
        <div style="background:linear-gradient(135deg,#7C3AED 0%,#4338CA 100%);border-radius:16px;padding:28px;color:white;margin-bottom:18px;text-align:center">
          <div style="font-size:10px;font-weight:700;opacity:0.7;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px">ברוטו לנטו — מחשבון מיסוי ישראלי • ${new Date().toLocaleDateString('he-IL')}</div>
          <div style="font-size:30px;font-weight:900;margin-bottom:6px">השוואת הצעות עבודה</div>
          <div style="font-size:13px;opacity:0.8;margin-bottom:22px">דוח מקיף — שכר נטו, הטבות, בונוסים, חיסכון</div>
          <div style="background:rgba(255,255,255,0.18);border-radius:14px;display:inline-block;padding:14px 28px">
            <div style="font-size:10px;opacity:0.75;margin-bottom:3px;font-weight:600">🏆 ההצעה הטובה ביותר</div>
            <div style="font-size:24px;font-weight:900">${winner?.name || '—'}</div>
            <div style="font-size:13px;opacity:0.85;margin-top:3px">ערך שנתי כולל: ${fmtNum(bestTotal)}</div>
          </div>
        </div>

        <!-- Offer summary cards -->
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap">
          ${summaryCards}
        </div>

        <!-- Comparison table -->
        <div style="border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;margin-bottom:14px">
          <table style="width:100%;border-collapse:collapse" dir="rtl">
            <thead>
              <tr>
                <th style="padding:12px 10px;text-align:right;font-size:11px;font-weight:700;color:#64748B;min-width:140px;background:#F8FAFC;border-bottom:2px solid #E2E8F0">קטגוריה</th>
                ${offerHeaders}
              </tr>
            </thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>

        <!-- Disclaimer -->
        <div style="text-align:center;font-size:10px;color:#94A3B8;padding:10px;border-top:1px solid #F1F5F9">
          * החישובים הם קירוב לצרכי השוואה. המסים בפועל תלויים בפרטים אישיים נוספים. RSU ואופציות — ערכם עתידי ואינו מובטח.
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

'use client'

import { useState, useCallback, useRef } from 'react'
import { parseFile, parseNumber, parseDate, parseCommissionRate, deriveContractYears } from '@/lib/partners/parser'
import { FIELD_DEFS, autoMatch } from '@/lib/partners/fieldDefs'
import { generateBillingSchedule } from '@/lib/partners/billing'
import type { ParsedFile, Deal, Partner, BillingEvent, ImportSession } from '@/lib/partners/types'

interface Props {
  onImportComplete: (partners: Partner[], deals: Deal[], events: BillingEvent[], session: ImportSession) => void
  existingPartners: Partner[]
}

type Step = 'upload' | 'map' | 'preview' | 'done'

function fmt(n: number) {
  return n.toLocaleString('he-IL')
}

export default function ImportWizard({ onImportComplete, existingPartners }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const data = await parseFile(file)
    setParsed(data)
    setMapping(autoMatch(data.headers))
    setStep('map')
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length
  const partnerField = mapping['partnerName']
  const canProceed = !!partnerField

  function buildDeals(): { deals: Deal[]; partners: Partner[]; events: BillingEvent[] } {
    if (!parsed) return { deals: [], partners: [], events: [] }

    const partnersMap = new Map<string, Partner>()

    // Seed from existing partners
    for (const p of existingPartners) {
      partnersMap.set(p.name.toLowerCase(), p)
    }

    const deals: Deal[] = []
    const events: BillingEvent[] = []

    for (const row of parsed.rows) {
      const get = (field: string) => {
        const col = mapping[field]
        return col ? (row[col] ?? '') : ''
      }

      const partnerName = get('partnerName').trim()
      if (!partnerName) continue

      const pKey = partnerName.toLowerCase()
      if (!partnersMap.has(pKey)) {
        partnersMap.set(pKey, {
          id: crypto.randomUUID(),
          name: partnerName,
          emails: [],
          notes: '',
          createdAt: new Date().toISOString(),
        })
      }
      const partner = partnersMap.get(pKey)!

      const dealAmount = parseNumber(get('dealAmount'))
      const commissionRate = parseCommissionRate(get('commissionRate'))
      const commissionAmount = commissionRate > 0 ? Math.round(dealAmount * (commissionRate / 100) * 100) / 100 : 0

      const contractStartDate = parseDate(get('contractStartDate'))
      const contractEndDate = parseDate(get('contractEndDate'))
      let contractYears = parseNumber(get('contractYears'))

      if (!contractYears || contractYears < 1) {
        contractYears = deriveContractYears(contractStartDate, contractEndDate)
      }
      contractYears = Math.round(contractYears)

      const deal: Deal = {
        id: crypto.randomUUID(),
        partnerId: partner.id,
        partnerName: partner.name,
        dealId: get('dealId').trim(),
        dealName: get('dealName').trim(),
        closeDate: parseDate(get('closeDate')),
        dealAmount,
        commissionRate,
        commissionAmount,
        isMultiYear: contractYears > 1,
        contractYears,
        contractStartDate,
        contractEndDate,
        paymentStatus: 'unpaid',
        paidAmount: 0,
        currency: get('currency').trim() || 'USD',
        notes: '',
        importedAt: new Date().toISOString(),
      }

      deals.push(deal)
      events.push(...generateBillingSchedule(deal))
    }

    return {
      deals,
      partners: Array.from(partnersMap.values()),
      events,
    }
  }

  function handleImport() {
    if (!parsed) return
    const { deals, partners, events } = buildDeals()
    const session: ImportSession = {
      id: crypto.randomUUID(),
      fileName: parsed.fileName,
      createdAt: new Date().toISOString(),
      totalRows: parsed.rows.length,
      importedDeals: deals.length,
      columnMapping: mapping,
    }
    onImportComplete(partners, deals, events, session)
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✓</div>
        <h2 className="text-2xl font-bold text-gray-900">הייבוא הושלם בהצלחה!</h2>
        <p className="text-gray-500">הנתונים נשמרו ומוצגים בלשוניות העסקאות והשותפים</p>
        <button
          onClick={() => { setStep('upload'); setParsed(null); setMapping({}) }}
          className="mt-2 px-5 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
        >
          ייבוא קובץ נוסף
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'map', 'preview'] as Step[]).map((s, i) => {
          const labels = ['העלאת קובץ', 'מיפוי עמודות', 'אישור ייבוא']
          const stepIndex = ['upload', 'map', 'preview'].indexOf(step)
          const done = stepIndex > i
          const active = step === s
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? 'bg-violet-600 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-violet-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>{labels[i]}</span>
              {i < 2 && <div className={`h-px w-12 ${done ? 'bg-violet-400' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/30'}`}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onInputChange} />
          <div className="text-5xl mb-4">📂</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">גרור קובץ לכאן או לחץ לבחירה</h3>
          <p className="text-gray-500 text-sm">תומך ב-CSV, Excel (.xlsx, .xls) — ייצוא מ-Salesforce</p>
        </div>
      )}

      {/* Step 2: Column Mapper */}
      {step === 'map' && parsed && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">מיפוי עמודות</h3>
              <p className="text-sm text-gray-500">{parsed.rows.length} שורות | {parsed.fileName}</p>
            </div>
            <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-medium">
              {mappedCount} / {FIELD_DEFS.length} עמודות זוהו
            </span>
          </div>

          <div className="grid gap-3">
            {FIELD_DEFS.map(field => {
              const currentVal = mapping[field.key]
              const sampleVal = currentVal && parsed.rows[0] ? parsed.rows[0][currentVal] : null
              return (
                <div key={field.key} className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all ${currentVal ? 'border-violet-200' : field.required ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                  <div className="w-36 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                      {field.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                    <span className="text-xs text-gray-400">{field.description}</span>
                  </div>

                  <div className="flex-1">
                    <select
                      value={currentVal ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value || null }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="">-- לא ממפה --</option>
                      {parsed.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {sampleVal && (
                    <div className="w-40 shrink-0">
                      <span className="text-xs text-gray-400 block mb-0.5">דוגמה:</span>
                      <span className="text-xs font-medium text-gray-700 truncate block">{sampleVal}</span>
                    </div>
                  )}

                  {currentVal && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">✓ ממופה</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              חזרה
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canProceed}
              className="px-6 py-2 rounded-xl bg-violet-600 text-white font-medium disabled:opacity-40 hover:bg-violet-700 transition-colors"
            >
              המשך לתצוגה מקדימה
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && parsed && (() => {
        const { deals, events } = buildDeals()
        const multiYear = deals.filter(d => d.isMultiYear).length
        const totalCommissions = deals.reduce((s, d) => s + d.commissionAmount, 0)

        return (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">תצוגה מקדימה לפני ייבוא</h3>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'עסקאות', value: deals.length, color: 'violet' },
                { label: 'שותפים', value: new Set(deals.map(d => d.partnerName)).size, color: 'blue' },
                { label: 'רב-שנתי', value: multiYear, color: 'amber' },
                { label: 'סה"כ עמלות', value: `$${fmt(Math.round(totalCommissions))}`, color: 'green' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-black text-gray-900">{c.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">שותף</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">עסקה</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">סכום</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">עמלה</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">שנות חוזה</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">אירועי חיוב</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.slice(0, 8).map(d => {
                      const dEvents = events.filter(e => e.dealId === d.id)
                      return (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-violet-50/20">
                          <td className="px-4 py-3 font-medium text-gray-900">{d.partnerName}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{d.dealName || d.dealId || '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{d.dealAmount ? `$${fmt(d.dealAmount)}` : '—'}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-violet-700">${fmt(Math.round(d.commissionAmount))}</span>
                            {d.commissionRate > 0 && <span className="text-xs text-gray-400 mr-1">({d.commissionRate}%)</span>}
                          </td>
                          <td className="px-4 py-3">
                            {d.isMultiYear
                              ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{d.contractYears} שנים</span>
                              : <span className="text-gray-400 text-xs">שנה אחת</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{dEvents.length} אירועים</td>
                        </tr>
                      )
                    })}
                    {deals.length > 8 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center text-xs text-gray-400">
                          + {deals.length - 8} עסקאות נוספות
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('map')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                חזרה לעריכת מיפוי
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors"
              >
                ייבא {deals.length} עסקאות
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

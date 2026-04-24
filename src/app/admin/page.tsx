'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, LogOut, ArrowRight } from 'lucide-react'
import type { TaxParameters, Settlement } from '@/lib/types'
import { DEFAULT_TAX_PARAMS, DEFAULT_SETTLEMENTS } from '@/lib/default-params'

export default function AdminPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [params, setParams] = useState<TaxParameters>(DEFAULT_TAX_PARAMS)
  const [settlements, setSettlements] = useState<Settlement[]>(DEFAULT_SETTLEMENTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'brackets' | 'bituach' | 'settlements' | 'general' | 'credits'>('brackets')
  const [newSettlement, setNewSettlement] = useState({ name: '', category: 'A' as 'A' | 'B' })

  useEffect(() => {
    const t = sessionStorage.getItem('admin_token')
    if (!t) {
      router.push('/admin/login')
      return
    }
    setToken(t)
    fetchData(t)
  }, [router])

  async function fetchData(t: string) {
    const res = await fetch('/api/tax-params')
    const json = await res.json()
    if (json.params) setParams(json.params)
    if (json.settlements) setSettlements(json.settlements)
  }

  async function saveParams() {
    setSaving(true)
    try {
      await fetch('/api/admin/update-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(params)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function addSettlement() {
    if (!newSettlement.name.trim()) return
    const res = await fetch('/api/admin/settlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(newSettlement)
    })
    const added = await res.json()
    setSettlements(prev => [...prev, added])
    setNewSettlement({ name: '', category: 'A' })
  }

  async function removeSettlement(id: string) {
    await fetch('/api/admin/settlements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id })
    })
    setSettlements(prev => prev.filter(s => s.id !== id))
  }

  const updateBracket = (i: number, field: string, value: number | null) => {
    const updated = [...params.income_tax_brackets]
    updated[i] = { ...updated[i], [field]: value }
    setParams(p => ({ ...p, income_tax_brackets: updated }))
  }

  const tabs = [
    { id: 'brackets', label: 'מדרגות מס' },
    { id: 'bituach', label: 'ביטוח לאומי' },
    { id: 'settlements', label: 'יישובים מזכים' },
    { id: 'general', label: 'כללי' },
    { id: 'credits', label: 'נקודות זיכוי' }
  ] as const

  return (
    <div className="min-h-screen" style={{ background: '#0A0A14' }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
            <ArrowRight className="w-4 h-4" />
            מחשבון
          </a>
          <span className="text-white/20">/</span>
          <h1 className="text-white font-bold">לוח אדמין</h1>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('admin_token'); router.push('/admin/login') }}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          יציאה
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Brackets */}
        {activeTab === 'brackets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">מדרגות מס הכנסה 2025</h2>
              <button
                onClick={saveParams}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: saved ? '#10b981' : '#F5C518', color: '#0A0A14' }}
              >
                <Save className="w-4 h-4" />
                {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-white/40 text-xs">
                    <th className="px-4 py-3 text-right">מדרגה</th>
                    <th className="px-4 py-3 text-right">מ-₪ (שנתי)</th>
                    <th className="px-4 py-3 text-right">עד-₪ (שנתי)</th>
                    <th className="px-4 py-3 text-right">שיעור %</th>
                  </tr>
                </thead>
                <tbody>
                  {params.income_tax_brackets.map((b, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white/60">{i + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={b.from}
                          onChange={e => updateBracket(i, 'from', Number(e.target.value))}
                          className="w-28 bg-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                          dir="ltr"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {b.to !== null ? (
                          <input
                            type="number"
                            value={b.to}
                            onChange={e => updateBracket(i, 'to', Number(e.target.value))}
                            className="w-28 bg-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                            dir="ltr"
                          />
                        ) : (
                          <span className="text-white/30 text-xs">ללא תקרה</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={Math.round(b.rate * 100)}
                            min={0}
                            max={100}
                            onChange={e => updateBracket(i, 'rate', Number(e.target.value) / 100)}
                            className="w-16 bg-white/10 rounded-lg px-2 py-1 text-amber-400 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                            dir="ltr"
                          />
                          <span className="text-white/40">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bituach Leumi */}
        {activeTab === 'bituach' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">ביטוח לאומי ובריאות</h2>
              <button
                onClick={saveParams}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: saved ? '#10b981' : '#F5C518', color: '#0A0A14' }}
              >
                <Save className="w-4 h-4" />
                {saved ? 'נשמר!' : 'שמור'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="ביטוח לאומי — שכיר">
                <FieldRow label="תקרת מדרגה נמוכה (₪)" value={params.bituach_leumi_employee_low_threshold}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_employee_low_threshold: v }))} />
                <FieldRow label="שיעור נמוך (%)" value={params.bituach_leumi_employee_low_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_employee_low_rate: v / 100 }))} />
                <FieldRow label="שיעור גבוה (%)" value={params.bituach_leumi_employee_high_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_employee_high_rate: v / 100 }))} />
                <FieldRow label="הכנסה מקסימלית (₪)" value={params.bituach_leumi_max_income}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_max_income: v }))} />
              </SectionCard>

              <SectionCard title="ביטוח לאומי — עצמאי">
                <FieldRow label="שיעור נמוך (%)" value={params.bituach_leumi_self_low_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_self_low_rate: v / 100 }))} />
                <FieldRow label="שיעור גבוה (%)" value={params.bituach_leumi_self_high_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_leumi_self_high_rate: v / 100 }))} />
              </SectionCard>

              <SectionCard title="ביטוח בריאות — שכיר">
                <FieldRow label="סף מעבר (₪)" value={params.bituach_briut_threshold}
                  onChange={v => setParams(p => ({ ...p, bituach_briut_threshold: v }))} />
                <FieldRow label="שיעור נמוך (%)" value={params.bituach_briut_low_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_briut_low_rate: v / 100 }))} />
                <FieldRow label="שיעור גבוה (%)" value={params.bituach_briut_high_rate * 100}
                  step={0.01}
                  onChange={v => setParams(p => ({ ...p, bituach_briut_high_rate: v / 100 }))} />
              </SectionCard>

              <SectionCard title="נקודת זיכוי ופנסיה">
                <FieldRow label="שווי נקודת זיכוי חודשי (₪)" value={params.credit_point_value_monthly}
                  step={1}
                  onChange={v => setParams(p => ({ ...p, credit_point_value_monthly: v }))} />
                <FieldRow label="תקרת הכנסה לניכוי פנסיה (₪)" value={params.pension_max_salary_for_deduction}
                  onChange={v => setParams(p => ({ ...p, pension_max_salary_for_deduction: v }))} />
              </SectionCard>
            </div>
          </div>
        )}

        {/* Settlements */}
        {activeTab === 'settlements' && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-lg">יישובים מזכים</h2>

            {/* Add new */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="שם יישוב..."
                value={newSettlement.name}
                onChange={e => setNewSettlement(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={newSettlement.category}
                onChange={e => setNewSettlement(prev => ({ ...prev, category: e.target.value as 'A' | 'B' }))}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="A">A — 20%</option>
                <option value="B">B — 10%</option>
              </select>
              <button
                onClick={addSettlement}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#F5C518', color: '#0A0A14' }}
              >
                <Plus className="w-4 h-4" />
                הוסף
              </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {settlements.map(s => (
                <div key={s.id}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-white text-sm font-medium">{s.name}</span>
                    <span className={`mr-2 text-xs px-2 py-0.5 rounded-full ${
                      s.category === 'A'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-blue-400 bg-blue-500/10'
                    }`}>
                      {s.category}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSettlement(s.id)}
                    className="text-white/30 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">הגדרות כלליות</h2>
              <button
                onClick={saveParams}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: saved ? '#10b981' : '#F5C518', color: '#0A0A14' }}
              >
                <Save className="w-4 h-4" />
                {saved ? 'נשמר!' : 'שמור'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="מס יסף">
                <FieldRow label="תקרה שנתית (₪)" value={params.mas_yasaf_threshold_annual}
                  onChange={v => setParams(p => ({ ...p, mas_yasaf_threshold_annual: v }))} />
                <FieldRow label="שיעור (%)" value={params.mas_yasaf_rate * 100} step={0.1}
                  onChange={v => setParams(p => ({ ...p, mas_yasaf_rate: v / 100 }))} />
              </SectionCard>
              <SectionCard title="יישוב מזכה">
                <FieldRow label="תקרת הכנסה שנתית (₪)" value={params.yishuv_mezake_income_ceiling}
                  onChange={v => setParams(p => ({ ...p, yishuv_mezake_income_ceiling: v }))} />
              </SectionCard>
            </div>
          </div>
        )}
        {/* Credit Points Reference */}
        {activeTab === 'credits' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-bold text-lg">מדריך נקודות זיכוי 2025</h2>
              <p className="text-white/40 text-sm mt-1">
                נקודת זיכוי אחת = ₪242/חודש = ₪2,904/שנה. הנתונים לעיון בלבד — לא ניתן לעריכה כאן.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-white/40 text-xs">
                    <th className="px-4 py-3 text-right">סוג זיכוי</th>
                    <th className="px-4 py-3 text-right">נקודות</th>
                    <th className="px-4 py-3 text-right">שווי/חודש</th>
                    <th className="px-4 py-3 text-right">תנאי זכאות</th>
                  </tr>
                </thead>
                <tbody>
                  {CREDIT_POINTS_REFERENCE.map((row, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/3">
                      <td className="px-4 py-3 text-white font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-amber-400 font-bold">{row.points}</td>
                      <td className="px-4 py-3 text-green-400">₪{Math.round(row.points * 242)}</td>
                      <td className="px-4 py-3 text-white/50 text-xs">{row.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-amber-400 font-bold mb-3 text-sm">על יישובים מזכים</h3>
              <div className="space-y-2 text-xs text-white/60">
                <p>בישראל, כל היישובים המוכרים בקטגוריה זהה מקבלים <strong className="text-white/80">אותה תקרת הכנסה</strong> (₪199,000 שנתי ב-2025) ואותו שיעור הנחה:</p>
                <p>• <strong className="text-amber-400">קטגוריה A</strong> (פריפריה קיצונית — אילת, ירוחם, דימונה וכד׳): <strong>20% הנחה</strong> על מס ההכנסה עד התקרה</p>
                <p>• <strong className="text-blue-400">קטגוריה B</strong> (פריפריה — נהריה, בית שאן, צפת וכד׳): <strong>10% הנחה</strong> על מס ההכנסה עד התקרה</p>
                <p className="text-white/40">ההנחה חלה על סכום המס (לא ההכנסה). למשל: בהכנסה של ₪10,000/חודש, הנחה של 20% על המס שחושב עד ₪199,000 שנתי.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const CREDIT_POINTS_REFERENCE = [
  { label: 'תושב ישראל (בסיס)', points: 2.25, condition: 'כל תושב ישראל' },
  { label: 'אישה', points: 0.5, condition: 'נשים בלבד' },
  { label: 'ילד — שנת לידה (אם)', points: 1.5, condition: 'אמא בשנת לידת הילד' },
  { label: 'ילד — שנת לידה (אב)', points: 1.0, condition: 'אב בשנת לידת הילד' },
  { label: 'ילד גיל 1–2 (אם)', points: 4.5, condition: 'אמא לילד בגיל 1–2' },
  { label: 'ילד גיל 1–2 (אב)', points: 2.0, condition: 'אב לילד בגיל 1–2' },
  { label: 'ילד גיל 3 (אם)', points: 3.5, condition: 'אמא לילד בגיל 3' },
  { label: 'ילד גיל 3 (אב)', points: 1.0, condition: 'אב לילד בגיל 3' },
  { label: 'ילד גיל 4–5 (אם)', points: 2.5, condition: 'אמא לילד בגיל 4–5' },
  { label: 'ילד גיל 4–5 (אב)', points: 1.0, condition: 'אב לילד בגיל 4–5' },
  { label: 'ילד גיל 6–17', points: 1.0, condition: 'כל הורה, לכל ילד בגיל 6–17' },
  { label: 'ילד עם נכות', points: 2.0, condition: 'בנוסף לנקודות הגיל הרגילות' },
  { label: 'הורה יחיד', points: 1.0, condition: 'הורה יחיד שיש לו ילדים קטינים' },
  { label: 'תשלום מזונות (פסק דין)', points: 1.0, condition: 'מי שמשלם מזונות לפי פסק דין' },
  { label: 'בן/ת זוג לא עובד/ת', points: 1.0, condition: 'אם בן/ת הזוג בעל נכות ≥90%, עיוור/ת, או מעל גיל פרישה' },
  { label: 'נכות 100% / עיוורון', points: 2.0, condition: 'נכות מוכרת 100% או עיוורון' },
  { label: 'נכות 90%+', points: 2.0, condition: 'נכות מוכרת 90% ומעלה' },
  { label: 'נכות 50%–89%', points: 1.0, condition: 'נכות מוכרת 50% עד 89%' },
  { label: 'עולה חדש', points: 3.0, condition: '36 חודשים ראשונים לעלייה (שנות המעבר: 2 נק׳)' },
  { label: 'חייל/ת משוחרר/ת', points: 1.0, condition: 'מי ששירת שירות חובה מלא בצבא' },
]

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-white font-semibold mb-4 text-sm">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FieldRow({ label, value, onChange, step = 1 }: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs text-white/60 flex-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-28 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500 text-right"
        dir="ltr"
      />
    </div>
  )
}

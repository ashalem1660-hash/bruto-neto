'use client'

import { useState, useMemo } from 'react'
import type { BillingEvent, Partner, PaymentStatus } from '@/lib/partners/types'

interface Props {
  events: BillingEvent[]
  partners: Partner[]
  onUpdateEvent: (id: string, changes: Partial<BillingEvent>) => void
  onUpdatePartnerEmails: (partnerId: string, emails: string[]) => void
}

function fmt(n: number) {
  return n.toLocaleString('he-IL')
}

function formatDate(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getEventStatus(event: BillingEvent): 'overdue' | 'soon' | 'future' | 'paid' {
  if (event.paymentStatus === 'paid') return 'paid'
  const now = new Date()
  const scheduled = new Date(event.scheduledDate)
  const diffDays = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 60) return 'soon'
  return 'future'
}

const EVENT_STYLE = {
  overdue: 'border-red-200 bg-red-50',
  soon: 'border-amber-200 bg-amber-50',
  future: 'border-gray-200 bg-white',
  paid: 'border-green-200 bg-green-50',
}

const EVENT_BADGE = {
  overdue: 'bg-red-100 text-red-700',
  soon: 'bg-amber-100 text-amber-700',
  future: 'bg-gray-100 text-gray-600',
  paid: 'bg-green-100 text-green-700',
}

const EVENT_LABEL = {
  overdue: 'באיחור',
  soon: 'בקרוב',
  future: 'עתידי',
  paid: 'שולם',
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'שולם',
  partial: 'שולם חלקי',
  unpaid: 'ממתין',
}

export default function BillingView({ events, partners, onUpdateEvent, onUpdatePartnerEmails }: Props) {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'soon' | 'future' | 'paid'>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [editingEmails, setEditingEmails] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState('')

  const partnerNames = useMemo(() => Array.from(new Set(events.map(e => e.partnerName))).sort(), [events])

  const enriched = useMemo(() =>
    events.map(e => ({ ...e, uiStatus: getEventStatus(e) })),
    [events]
  )

  const filtered = useMemo(() => {
    let list = enriched
    if (filter !== 'all') list = list.filter(e => e.uiStatus === filter)
    if (partnerFilter !== 'all') list = list.filter(e => e.partnerName === partnerFilter)
    return [...list].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
  }, [enriched, filter, partnerFilter])

  const counts = useMemo(() => ({
    overdue: enriched.filter(e => e.uiStatus === 'overdue').length,
    soon: enriched.filter(e => e.uiStatus === 'soon').length,
    future: enriched.filter(e => e.uiStatus === 'future').length,
    paid: enriched.filter(e => e.uiStatus === 'paid').length,
  }), [enriched])

  const totalPending = enriched.filter(e => e.uiStatus !== 'paid').reduce((s, e) => s + e.amount, 0)
  const totalPaid = enriched.filter(e => e.uiStatus === 'paid').reduce((s, e) => s + e.amount, 0)

  function getPartnerEmails(partnerId: string): string[] {
    return partners.find(p => p.id === partnerId)?.emails ?? []
  }

  function startEditEmails(event: BillingEvent) {
    const emails = getPartnerEmails(event.partnerId)
    setEmailDraft(emails.join(', '))
    setEditingEmails(event.id)
  }

  function saveEmails(event: BillingEvent) {
    const emails = emailDraft.split(',').map(e => e.trim()).filter(Boolean)
    onUpdatePartnerEmails(event.partnerId, emails)
    setEditingEmails(null)
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="text-5xl">📅</div>
        <h3 className="text-xl font-bold text-gray-700">אין אירועי חיוב עדיין</h3>
        <p className="text-gray-400 text-sm">ייבא עסקאות כדי לראות את לוח החיובים</p>
      </div>
    )
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'overdue', label: 'באיחור', count: counts.overdue, amount: enriched.filter(e => e.uiStatus === 'overdue').reduce((s, e) => s + e.amount, 0), color: 'red' },
          { key: 'soon', label: 'בקרוב (60 יום)', count: counts.soon, amount: enriched.filter(e => e.uiStatus === 'soon').reduce((s, e) => s + e.amount, 0), color: 'amber' },
          { key: 'future', label: 'עתידי', count: counts.future, amount: enriched.filter(e => e.uiStatus === 'future').reduce((s, e) => s + e.amount, 0), color: 'gray' },
          { key: 'paid', label: 'שולם', count: counts.paid, amount: totalPaid, color: 'green' },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setFilter(filter === c.key as typeof filter ? 'all' : c.key as typeof filter)}
            className={`rounded-xl border p-4 text-right transition-all ${filter === c.key ? 'ring-2 ring-violet-400' : ''} ${c.color === 'red' ? 'border-red-200 bg-red-50' : c.color === 'amber' ? 'border-amber-200 bg-amber-50' : c.color === 'green' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
          >
            <div className="text-2xl font-black text-gray-900">{c.count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            {c.amount > 0 && <div className="text-xs font-semibold text-gray-700 mt-1">${fmt(Math.round(c.amount))}</div>}
          </button>
        ))}
      </div>

      {/* Partner filter */}
      <div className="flex gap-3 mb-5">
        <select
          value={partnerFilter}
          onChange={e => setPartnerFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">כל השותפים</option>
          {partnerNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} אירועים | ממתין: <strong className="text-violet-700">${fmt(Math.round(totalPending))}</strong></span>
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filtered.map(event => (
          <div key={event.id} className={`rounded-xl border p-5 transition-all ${EVENT_STYLE[event.uiStatus]}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-gray-900">{event.partnerName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_BADGE[event.uiStatus]}`}>
                    {EVENT_LABEL[event.uiStatus]}
                  </span>
                  {event.totalYears > 1 && (
                    <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                      שנה {event.yearNumber} מתוך {event.totalYears}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate mb-2">{event.dealName}</div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>📅 {formatDate(event.scheduledDate)}</span>
                  <span className="font-bold text-gray-900">{event.currency} {fmt(Math.round(event.amount))}</span>
                </div>

                {/* Partner emails */}
                {editingEmails === event.id ? (
                  <div className="mt-3 flex gap-2 items-center">
                    <input
                      value={emailDraft}
                      onChange={e => setEmailDraft(e.target.value)}
                      placeholder="email1@co.com, email2@co.com"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                    <button onClick={() => saveEmails(event)} className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700">שמור</button>
                    <button onClick={() => setEditingEmails(null)} className="text-xs text-gray-400 hover:text-gray-600">ביטול</button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {getPartnerEmails(event.partnerId).map(email => (
                      <span key={email} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✉️ {email}</span>
                    ))}
                    <button
                      onClick={() => startEditEmails(event)}
                      className="text-xs text-violet-600 hover:text-violet-800 underline"
                    >
                      {getPartnerEmails(event.partnerId).length > 0 ? 'ערוך מיילים' : '+ הוסף מייל שותף'}
                    </button>
                  </div>
                )}
              </div>

              {/* Status update */}
              <div className="shrink-0 flex flex-col gap-2 items-end">
                <select
                  value={event.paymentStatus}
                  onChange={e => onUpdateEvent(event.id, { paymentStatus: e.target.value as PaymentStatus })}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="unpaid">ממתין</option>
                  <option value="partial">שולם חלקי</option>
                  <option value="paid">שולם ✓</option>
                </select>
                {event.paymentStatus === 'partial' && (
                  <input
                    type="number"
                    placeholder="סכום ששולם"
                    value={event.paidAmount || ''}
                    onChange={e => onUpdateEvent(event.id, { paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                )}
                {!event.reminderSent && event.uiStatus !== 'paid' && (
                  <button
                    onClick={() => onUpdateEvent(event.id, { reminderSent: true })}
                    className="text-xs text-violet-600 hover:text-violet-800 underline"
                  >
                    סמן תזכורת נשלחה
                  </button>
                )}
                {event.reminderSent && (
                  <span className="text-xs text-green-600">✓ תזכורת נשלחה</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { partnersStore } from '@/lib/partners/store'
import type { Partner, Deal, BillingEvent, ImportSession, PaymentStatus } from '@/lib/partners/types'
import ImportWizard from '@/components/partners/ImportWizard'
import DealsTable from '@/components/partners/DealsTable'
import BillingView from '@/components/partners/BillingView'

type View = 'dashboard' | 'import' | 'deals' | 'partners' | 'billing'

function fmt(n: number) {
  return n.toLocaleString('he-IL')
}

function formatDate(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'שולם',
  partial: 'חלקי',
  unpaid: 'לא שולם',
}

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'סקירה כללית', icon: '◉' },
  { key: 'import', label: 'ייבוא נתונים', icon: '↑' },
  { key: 'deals', label: 'עסקאות', icon: '≡' },
  { key: 'partners', label: 'שותפים', icon: '⬡' },
  { key: 'billing', label: 'לוח חיובים', icon: '⊞' },
]

export default function PartnersPage() {
  const [view, setView] = useState<View>('dashboard')
  const [partners, setPartners] = useState<Partner[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([])
  const [sessions, setSessions] = useState<ImportSession[]>([])
  const [editingPartner, setEditingPartner] = useState<string | null>(null)
  const [partnerEmailDraft, setPartnerEmailDraft] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    setPartners(partnersStore.getPartners())
    setDeals(partnersStore.getDeals())
    setBillingEvents(partnersStore.getBillingEvents())
    setSessions(partnersStore.getSessions())
  }, [])

  // Persist changes
  const savePartners = useCallback((data: Partner[]) => {
    setPartners(data)
    partnersStore.savePartners(data)
  }, [])

  const saveDeals = useCallback((data: Deal[]) => {
    setDeals(data)
    partnersStore.saveDeals(data)
  }, [])

  const saveBillingEvents = useCallback((data: BillingEvent[]) => {
    setBillingEvents(data)
    partnersStore.saveBillingEvents(data)
  }, [])

  const saveSessions = useCallback((data: ImportSession[]) => {
    setSessions(data)
    partnersStore.saveSessions(data)
  }, [])

  // Import handler
  const handleImportComplete = useCallback((
    newPartners: Partner[],
    newDeals: Deal[],
    newEvents: BillingEvent[],
    session: ImportSession,
  ) => {
    // Merge partners (keep existing emails/notes)
    const mergedPartners = [...newPartners]
    for (const existing of partners) {
      const idx = mergedPartners.findIndex(p => p.name.toLowerCase() === existing.name.toLowerCase())
      if (idx >= 0) {
        mergedPartners[idx] = { ...mergedPartners[idx], emails: existing.emails, notes: existing.notes }
      } else {
        mergedPartners.push(existing)
      }
    }
    savePartners(mergedPartners)
    saveDeals([...deals, ...newDeals])
    saveBillingEvents([...billingEvents, ...newEvents])
    saveSessions([session, ...sessions])
    setTimeout(() => setView('deals'), 800)
  }, [partners, deals, billingEvents, sessions, savePartners, saveDeals, saveBillingEvents, saveSessions])

  const handleUpdateDeal = useCallback((id: string, changes: Partial<Deal>) => {
    const updated = deals.map(d => d.id === id ? { ...d, ...changes } : d)
    saveDeals(updated)
    // Sync billing events payment status if changed
    if (changes.paymentStatus !== undefined) {
      const deal = deals.find(d => d.id === id)
      if (deal) {
        const updatedEvents = billingEvents.map(e =>
          e.dealId === id && e.yearNumber === 1 ? { ...e, paymentStatus: changes.paymentStatus! } : e
        )
        saveBillingEvents(updatedEvents)
      }
    }
  }, [deals, billingEvents, saveDeals, saveBillingEvents])

  const handleUpdateEvent = useCallback((id: string, changes: Partial<BillingEvent>) => {
    saveBillingEvents(billingEvents.map(e => e.id === id ? { ...e, ...changes } : e))
  }, [billingEvents, saveBillingEvents])

  const handleUpdatePartnerEmails = useCallback((partnerId: string, emails: string[]) => {
    savePartners(partners.map(p => p.id === partnerId ? { ...p, emails } : p))
  }, [partners, savePartners])

  // Dashboard stats
  const totalCommissions = deals.reduce((s, d) => s + d.commissionAmount, 0)
  const paidCommissions = deals.filter(d => d.paymentStatus === 'paid').reduce((s, d) => s + d.commissionAmount, 0)
  const unpaidCommissions = deals.filter(d => d.paymentStatus === 'unpaid').reduce((s, d) => s + d.commissionAmount, 0)
  const multiYearDeals = deals.filter(d => d.isMultiYear).length

  const now = new Date()
  const upcomingEvents = billingEvents
    .filter(e => {
      if (e.paymentStatus === 'paid') return false
      const diff = (new Date(e.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 90
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5)

  const overdueEvents = billingEvents.filter(e => {
    if (e.paymentStatus === 'paid') return false
    return new Date(e.scheduledDate) < now
  }).length

  // Chart data: commissions by partner
  const chartData = Object.entries(
    deals.reduce<Record<string, number>>((acc, d) => {
      acc[d.partnerName] = (acc[d.partnerName] ?? 0) + d.commissionAmount
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount: Math.round(amount) }))

  const CHART_COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#6D28D9', '#5B21B6', '#9333EA', '#7E22CE']

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-l border-gray-200 flex flex-col min-h-screen sticky top-0 h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-lg">F</div>
            <div>
              <div className="font-black text-gray-900 text-sm leading-tight">FinOps</div>
              <div className="text-xs text-gray-400">Partner Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right ${view === item.key ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {item.key === 'billing' && overdueEvents > 0 && (
                <span className="mr-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {overdueEvents}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            {deals.length} עסקאות · {partners.length} שותפים
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 min-h-screen overflow-auto">
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900">סקירה כללית</h1>
                <p className="text-gray-500 text-sm mt-1">ניהול עמלות ושותפים</p>
              </div>
              {sessions[0] && (
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  עדכון אחרון: {formatDate(sessions[0].createdAt)}
                </span>
              )}
            </div>

            {deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-5 bg-white rounded-2xl border border-gray-200">
                <div className="text-7xl">🚀</div>
                <h2 className="text-2xl font-black text-gray-800">ברוכים הבאים ל-FinOps!</h2>
                <p className="text-gray-500 text-center max-w-sm">
                  ייבאו את קובץ ה-Salesforce שלכם כדי להתחיל לנהל עמלות שותפים, לוחות חיוב ותזכורות
                </p>
                <button
                  onClick={() => setView('import')}
                  className="px-8 py-3 rounded-xl bg-violet-600 text-white font-bold text-lg hover:bg-violet-700 transition-colors"
                >
                  ייבא קובץ ראשון
                </button>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'סה"כ עמלות', value: `$${fmt(Math.round(totalCommissions))}`, sub: `${deals.length} עסקאות`, color: 'violet' },
                    { label: 'שולם', value: `$${fmt(Math.round(paidCommissions))}`, sub: `${deals.filter(d => d.paymentStatus === 'paid').length} עסקאות`, color: 'green' },
                    { label: 'ממתין לתשלום', value: `$${fmt(Math.round(unpaidCommissions))}`, sub: `${deals.filter(d => d.paymentStatus === 'unpaid').length} עסקאות`, color: 'red' },
                    { label: 'עסקאות רב-שנתיות', value: multiYearDeals, sub: `${billingEvents.length} אירועי חיוב`, color: 'amber' },
                  ].map(c => (
                    <div key={c.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <div className={`text-2xl font-black mb-1 ${c.color === 'violet' ? 'text-violet-700' : c.color === 'green' ? 'text-green-700' : c.color === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
                        {c.value}
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{c.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Chart */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">עמלות לפי שותף</h3>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <XAxis type="number" tickFormatter={v => `$${fmt(v)}`} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                          <Tooltip formatter={(v) => `$${fmt(Number(v))}`} />
                          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                            {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-300">אין נתונים</div>
                    )}
                  </div>

                  {/* Upcoming billing */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800">חיובים קרובים (90 יום)</h3>
                      <button onClick={() => setView('billing')} className="text-xs text-violet-600 hover:underline">הכל</button>
                    </div>
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-300 text-sm">אין חיובים קרובים</div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map(e => {
                          const diffDays = Math.round((new Date(e.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                          return (
                            <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <div>
                                <div className="text-sm font-medium text-gray-800">{e.partnerName}</div>
                                <div className="text-xs text-gray-400">{formatDate(e.scheduledDate)} · {diffDays === 0 ? 'היום' : `עוד ${diffDays} ימים`}</div>
                              </div>
                              <div className="text-sm font-bold text-violet-700">{e.currency} {fmt(Math.round(e.amount))}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent deals */}
                <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">עסקאות אחרונות</h3>
                    <button onClick={() => setView('deals')} className="text-xs text-violet-600 hover:underline">כל העסקאות</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-right pb-2 font-semibold text-gray-500">שותף</th>
                          <th className="text-right pb-2 font-semibold text-gray-500">עסקה</th>
                          <th className="text-right pb-2 font-semibold text-gray-500">עמלה</th>
                          <th className="text-right pb-2 font-semibold text-gray-500">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...deals].reverse().slice(0, 5).map(d => (
                          <tr key={d.id} className="border-b border-gray-50 last:border-0">
                            <td className="py-2.5 font-medium text-gray-900">{d.partnerName}</td>
                            <td className="py-2.5 text-gray-500 max-w-[200px] truncate">{d.dealName || d.dealId || '—'}</td>
                            <td className="py-2.5 font-bold text-violet-700">{d.currency} {fmt(Math.round(d.commissionAmount))}</td>
                            <td className="py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[d.paymentStatus]}`}>
                                {STATUS_LABEL[d.paymentStatus]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Import */}
        {view === 'import' && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">ייבוא נתונים</h1>
            <p className="text-gray-500 mb-8 text-sm">ייבא קובץ CSV או Excel מ-Salesforce</p>
            <ImportWizard onImportComplete={handleImportComplete} existingPartners={partners} />
          </div>
        )}

        {/* Deals */}
        {view === 'deals' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900">עסקאות</h1>
                <p className="text-gray-500 text-sm mt-1">{deals.length} עסקאות סה"כ</p>
              </div>
              <button
                onClick={() => setView('import')}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                + ייבא עסקאות
              </button>
            </div>
            <DealsTable deals={deals} partners={partners} onUpdateDeal={handleUpdateDeal} />
          </div>
        )}

        {/* Partners */}
        {view === 'partners' && (
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-8">שותפים</h1>
            {partners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl">⬡</div>
                <h3 className="text-xl font-bold text-gray-700">אין שותפים עדיין</h3>
                <p className="text-gray-400 text-sm">ייבא עסקאות כדי להוסיף שותפים</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {partners.map(partner => {
                  const partnerDeals = deals.filter(d => d.partnerId === partner.id)
                  const total = partnerDeals.reduce((s, d) => s + d.commissionAmount, 0)
                  const paid = partnerDeals.filter(d => d.paymentStatus === 'paid').reduce((s, d) => s + d.commissionAmount, 0)
                  const multiYear = partnerDeals.filter(d => d.isMultiYear).length

                  return (
                    <div key={partner.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-xl shrink-0">
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg">{partner.name}</h3>
                            <div className="flex gap-4 text-sm text-gray-500 mt-0.5">
                              <span>{partnerDeals.length} עסקאות</span>
                              {multiYear > 0 && <span>{multiYear} רב-שנתי</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-violet-700">${fmt(Math.round(total))}</div>
                          <div className="text-xs text-gray-400">שולם: ${fmt(Math.round(paid))}</div>
                        </div>
                      </div>

                      {/* Emails */}
                      <div className="mt-4 flex items-center gap-2 flex-wrap border-t border-gray-50 pt-4">
                        {editingPartner === partner.id ? (
                          <div className="flex gap-2 items-center w-full">
                            <input
                              value={partnerEmailDraft}
                              onChange={e => setPartnerEmailDraft(e.target.value)}
                              placeholder="email1@co.com, email2@co.com"
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                            <button
                              onClick={() => {
                                const emails = partnerEmailDraft.split(',').map(e => e.trim()).filter(Boolean)
                                savePartners(partners.map(p => p.id === partner.id ? { ...p, emails } : p))
                                setEditingPartner(null)
                              }}
                              className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700"
                            >
                              שמור
                            </button>
                            <button onClick={() => setEditingPartner(null)} className="text-sm text-gray-400 hover:text-gray-600">ביטול</button>
                          </div>
                        ) : (
                          <>
                            {partner.emails.map(email => (
                              <span key={email} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">✉️ {email}</span>
                            ))}
                            <button
                              onClick={() => {
                                setEditingPartner(partner.id)
                                setPartnerEmailDraft(partner.emails.join(', '))
                              }}
                              className="text-xs text-violet-600 hover:text-violet-800 underline"
                            >
                              {partner.emails.length > 0 ? 'ערוך מיילים' : '+ הוסף מייל'}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Deals mini-table */}
                      {partnerDeals.length > 0 && (
                        <div className="mt-4 border-t border-gray-50 pt-4">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">עסקאות</div>
                          <div className="space-y-1.5">
                            {partnerDeals.slice(0, 3).map(d => (
                              <div key={d.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 truncate max-w-[250px]">{d.dealName || d.dealId || 'עסקה'}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-medium text-gray-900">${fmt(Math.round(d.commissionAmount))}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[d.paymentStatus]}`}>
                                    {STATUS_LABEL[d.paymentStatus]}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {partnerDeals.length > 3 && (
                              <button onClick={() => setView('deals')} className="text-xs text-violet-600 hover:underline">
                                + {partnerDeals.length - 3} עוד
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Billing */}
        {view === 'billing' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900">לוח חיובים</h1>
                <p className="text-gray-500 text-sm mt-1">{billingEvents.length} אירועי חיוב</p>
              </div>
            </div>
            <BillingView
              events={billingEvents}
              partners={partners}
              onUpdateEvent={handleUpdateEvent}
              onUpdatePartnerEmails={handleUpdatePartnerEmails}
            />
          </div>
        )}
      </main>
    </div>
  )
}

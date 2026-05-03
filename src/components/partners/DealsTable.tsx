'use client'

import { useState, useMemo } from 'react'
import type { Deal, Partner, PaymentStatus } from '@/lib/partners/types'

interface Props {
  deals: Deal[]
  partners: Partner[]
  onUpdateDeal: (id: string, changes: Partial<Deal>) => void
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'שולם',
  partial: 'שולם חלקי',
  unpaid: 'לא שולם',
}

const STATUS_STYLE: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-700 border border-green-200',
  partial: 'bg-amber-100 text-amber-700 border border-amber-200',
  unpaid: 'bg-red-100 text-red-600 border border-red-200',
}

function fmt(n: number) {
  return n.toLocaleString('he-IL')
}

function formatDate(d: string) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DealsTable({ deals, partners, onUpdateDeal }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<keyof Deal>('importedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)

  const partnerNames = useMemo(() => Array.from(new Set(deals.map(d => d.partnerName))).sort(), [deals])

  const filtered = useMemo(() => {
    let list = deals
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.partnerName.toLowerCase().includes(q) ||
        d.dealName?.toLowerCase().includes(q) ||
        d.dealId?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter(d => d.paymentStatus === statusFilter)
    if (partnerFilter !== 'all') list = list.filter(d => d.partnerName === partnerFilter)

    list = [...list].sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'he')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [deals, search, statusFilter, partnerFilter, sortKey, sortDir])

  function handleSort(key: keyof Deal) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const totalCommissions = filtered.reduce((s, d) => s + d.commissionAmount, 0)
  const paidCommissions = filtered.filter(d => d.paymentStatus === 'paid').reduce((s, d) => s + d.commissionAmount, 0)

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="text-5xl">📋</div>
        <h3 className="text-xl font-bold text-gray-700">אין עסקאות עדיין</h3>
        <p className="text-gray-400 text-sm">ייבא קובץ Salesforce כדי להתחיל</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש שותף / עסקה..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as PaymentStatus | 'all')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="unpaid">לא שולם</option>
          <option value="partial">שולם חלקי</option>
          <option value="paid">שולם</option>
        </select>
        <select
          value={partnerFilter}
          onChange={e => setPartnerFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">כל השותפים</option>
          {partnerNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-gray-500">{filtered.length} עסקאות</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-700">סה"כ עמלות: <strong className="text-violet-700">${fmt(Math.round(totalCommissions))}</strong></span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-700">שולם: <strong className="text-green-700">${fmt(Math.round(paidCommissions))}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  { key: 'partnerName', label: 'שותף' },
                  { key: 'dealName', label: 'עסקה' },
                  { key: 'dealAmount', label: 'סכום' },
                  { key: 'commissionAmount', label: 'עמלה' },
                  { key: 'closeDate', label: 'תאריך סגירה' },
                  { key: 'contractYears', label: 'חוזה' },
                  { key: 'paymentStatus', label: 'סטטוס' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key as keyof Deal)}
                    className="text-right px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-violet-700 select-none whitespace-nowrap"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="mr-1 text-violet-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(deal => (
                <>
                  <tr
                    key={deal.id}
                    className="border-b border-gray-50 hover:bg-violet-50/20 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === deal.id ? null : deal.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{deal.partnerName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {deal.dealName || deal.dealId || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {deal.dealAmount ? `${deal.currency} ${fmt(deal.dealAmount)}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-violet-700">{deal.currency} {fmt(Math.round(deal.commissionAmount))}</span>
                      {deal.commissionRate > 0 && (
                        <span className="text-xs text-gray-400 mr-1">({deal.commissionRate}%)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.closeDate)}</td>
                    <td className="px-4 py-3">
                      {deal.isMultiYear
                        ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{deal.contractYears}Y</span>
                        : <span className="text-gray-400 text-xs">1Y</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[deal.paymentStatus]}`}>
                        {STATUS_LABELS[deal.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {expandedId === deal.id ? '▲' : '▼'}
                    </td>
                  </tr>

                  {expandedId === deal.id && (
                    <tr key={`${deal.id}-exp`} className="bg-violet-50/30">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-6">
                          {/* Deal details */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">פרטי עסקה</h4>
                            <div className="space-y-1.5 text-sm">
                              {deal.dealId && <div className="flex justify-between"><span className="text-gray-500">מזהה SF:</span><span className="font-mono text-xs text-gray-700">{deal.dealId}</span></div>}
                              <div className="flex justify-between"><span className="text-gray-500">תחילת חוזה:</span><span>{formatDate(deal.contractStartDate) || '—'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">סיום חוזה:</span><span>{formatDate(deal.contractEndDate) || '—'}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">מטבע:</span><span>{deal.currency}</span></div>
                            </div>
                          </div>

                          {/* Payment */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">עדכון תשלום</h4>
                            <div className="space-y-2">
                              <select
                                value={deal.paymentStatus}
                                onChange={e => onUpdateDeal(deal.id, { paymentStatus: e.target.value as PaymentStatus })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                              >
                                <option value="unpaid">לא שולם</option>
                                <option value="partial">שולם חלקי</option>
                                <option value="paid">שולם</option>
                              </select>
                              {deal.paymentStatus === 'partial' && (
                                <input
                                  type="number"
                                  placeholder="סכום ששולם"
                                  value={deal.paidAmount || ''}
                                  onChange={e => onUpdateDeal(deal.id, { paidAmount: parseFloat(e.target.value) || 0 })}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                />
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">הערות</h4>
                            <textarea
                              value={deal.notes}
                              onChange={e => onUpdateDeal(deal.id, { notes: e.target.value })}
                              rows={3}
                              placeholder="הוסף הערה..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

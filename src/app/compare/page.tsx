'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTaxParams } from '@/hooks/useTaxParams'
import { calculateOffer } from '@/lib/compare-calculator'
import type { JobOffer, PersonalProfile, OfferResult } from '@/lib/compare-types'
import { DEFAULT_OFFER, DEFAULT_PROFILE, OFFER_COLORS } from '@/lib/compare-types'
import { OfferCard } from '@/components/compare/OfferCard'
import { CompareTable } from '@/components/compare/CompareTable'
import { PersonalProfileCard } from '@/components/compare/PersonalProfileCard'

const COLORS = ['violet', 'green', 'blue', 'orange'] as const
const MAX_OFFERS = 4
const LS_KEY = 'bruto-neto-compare-v1'

function makeOffer(index: number): JobOffer {
  return {
    ...DEFAULT_OFFER,
    id: Math.random().toString(36).slice(2),
    name: `הצעה ${index + 1}`,
    color: COLORS[index % COLORS.length],
  }
}

function loadState(): { offers: JobOffer[]; profile: PersonalProfile } {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.offers?.length > 0) return parsed
    }
  } catch {}
  return {
    offers: [makeOffer(0), makeOffer(1)],
    profile: DEFAULT_PROFILE,
  }
}

function saveState(offers: JobOffer[], profile: PersonalProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ offers, profile }))
  } catch {}
}

export default function ComparePage() {
  const { data, loading } = useTaxParams()
  const [offers, setOffers] = useState<JobOffer[]>([makeOffer(0), makeOffer(1)])
  const [profile, setProfile] = useState<PersonalProfile>(DEFAULT_PROFILE)
  const [results, setResults] = useState<OfferResult[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const state = loadState()
    setOffers(state.offers)
    setProfile(state.profile)
    setHydrated(true)
  }, [])

  // Calculate results
  useEffect(() => {
    if (!hydrated || loading || !data.params) return
    try {
      const r = offers.map(o => calculateOffer(o, profile, data.params))
      setResults(r)
      saveState(offers, profile)
    } catch (e) {
      console.error(e)
    }
  }, [offers, profile, data.params, loading, hydrated])

  const addOffer = useCallback(() => {
    if (offers.length >= MAX_OFFERS) return
    setOffers(prev => [...prev, makeOffer(prev.length)])
  }, [offers.length])

  const removeOffer = useCallback((id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id))
  }, [])

  const updateOffer = useCallback((id: string, updates: Partial<JobOffer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
  }, [])

  const updateProfile = useCallback((updates: Partial<PersonalProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg animate-pulse">טוען פרמטרי מס...</div>
      </div>
    )
  }

  const bestTotal = results.length > 0 ? Math.max(...results.map(r => r.totalWithSavingsAnnual)) : 0

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
              <span className="text-white text-sm">⚖️</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-gray-900 leading-none">השוואת הצעות</h1>
              <p className="text-xs text-gray-400">השווה חבילות שכר כוללות — נטו, הטבות, חיסכון</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">מחשבון ברוטו-נטו</span>
            </Link>
            {offers.length < MAX_OFFERS && (
              <button
                onClick={addOffer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                הוסף הצעה
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        {/* Winner banner */}
        {results.length >= 2 && bestTotal > 0 && (
          <div className="rounded-2xl bg-gradient-to-l from-violet-600 to-violet-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div>
              <div className="text-xs font-medium opacity-80 mb-0.5">הצעה הטובה ביותר (שכר + הטבות + חיסכון)</div>
              <div className="text-2xl font-black">
                {offers[results.findIndex(r => r.totalWithSavingsAnnual === bestTotal)]?.name || '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70 mb-0.5">ערך שנתי כולל</div>
              <div className="text-3xl font-black">
                ₪{Math.round(bestTotal).toLocaleString('he-IL')}
              </div>
            </div>
          </div>
        )}

        {/* Personal profile */}
        <PersonalProfileCard profile={profile} onChange={updateProfile} />

        {/* Offers grid */}
        <div className={`grid gap-4 ${
          offers.length === 1 ? 'grid-cols-1 max-w-md' :
          offers.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          offers.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
        }`}>
          {offers.map((offer, i) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onChange={updates => updateOffer(offer.id, updates)}
              onRemove={() => removeOffer(offer.id)}
              canRemove={offers.length > 1}
            />
          ))}
          {/* Add offer placeholder */}
          {offers.length < MAX_OFFERS && (
            <button
              onClick={addOffer}
              className="rounded-2xl border-2 border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-3 py-16 text-gray-400 hover:text-violet-600 min-h-[200px]"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium">הוסף הצעה</span>
              <span className="text-xs">{MAX_OFFERS - offers.length} נותרו</span>
            </button>
          )}
        </div>

        {/* Results table */}
        {results.length > 0 && (
          <CompareTable offers={offers} results={results} />
        )}

        {/* Disclaimer */}
        <div className="text-xs text-gray-400 text-center space-y-1 pb-8">
          <p>* החישובים הם קירוב לצרכי השוואה. המסים בפועל תלויים בפרטים אישיים נוספים.</p>
          <p>* RSU ואופציות — ערכם עתידי ואינו מובטח. השוואה על בסיס ערך משוער בלבד.</p>
          <p>* שווי שימוש ברכב חברה — מחושב לפי ערך שהזנת, ולא לפי מחירון רשות המסים.</p>
        </div>

      </main>
    </div>
  )
}

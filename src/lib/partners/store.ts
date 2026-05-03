import type { Partner, Deal, BillingEvent, ImportSession } from './types'

const KEYS = {
  partners: 'finops_partners',
  deals: 'finops_deals',
  billing: 'finops_billing',
  sessions: 'finops_sessions',
}

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

export const partnersStore = {
  getPartners: () => load<Partner>(KEYS.partners),
  savePartners: (data: Partner[]) => save(KEYS.partners, data),
  getDeals: () => load<Deal>(KEYS.deals),
  saveDeals: (data: Deal[]) => save(KEYS.deals, data),
  getBillingEvents: () => load<BillingEvent>(KEYS.billing),
  saveBillingEvents: (data: BillingEvent[]) => save(KEYS.billing, data),
  getSessions: () => load<ImportSession>(KEYS.sessions),
  saveSessions: (data: ImportSession[]) => save(KEYS.sessions, data),
  clearAll: () => {
    if (typeof window === 'undefined') return
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },
}

'use client'

import { useState, useEffect } from 'react'
import type { TaxApiResponse } from '@/lib/types'
import { DEFAULT_TAX_PARAMS, DEFAULT_SETTLEMENTS } from '@/lib/default-params'

export function useTaxParams() {
  const [data, setData] = useState<TaxApiResponse>({
    params: DEFAULT_TAX_PARAMS,
    settlements: DEFAULT_SETTLEMENTS,
    deductions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tax-params')
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        if (json.params) {
          // merge with defaults so new fields missing from old DB rows get defaults
          setData({
            params: { ...DEFAULT_TAX_PARAMS, ...json.params },
            settlements: json.settlements || DEFAULT_SETTLEMENTS,
            deductions: json.deductions || []
          })
        }
      } catch {
        // silently fall back to defaults
        setError('שגיאה בטעינת פרמטרים, משתמש בברירות מחדל')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { data, loading, error }
}

import { NextResponse } from 'next/server'
import { createPublicServerClient } from '@/lib/supabase-server'
import { DEFAULT_TAX_PARAMS, DEFAULT_SETTLEMENTS } from '@/lib/default-params'

export const revalidate = 3600

export async function GET() {
  try {
    const supabase = createPublicServerClient()

    const [paramsRes, settlementsRes, deductionsRes] = await Promise.all([
      supabase
        .from('tax_parameters')
        .select('*')
        .eq('is_active', true)
        .order('year', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('recognized_settlements')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('self_employed_deductions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
    ])

    return NextResponse.json({
      params: paramsRes.data ?? DEFAULT_TAX_PARAMS,
      settlements: settlementsRes.data ?? DEFAULT_SETTLEMENTS,
      deductions: deductionsRes.data ?? []
    })
  } catch {
    return NextResponse.json({
      params: DEFAULT_TAX_PARAMS,
      settlements: DEFAULT_SETTLEMENTS,
      deductions: []
    })
  }
}

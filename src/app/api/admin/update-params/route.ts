import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  return token === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('tax_parameters')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('is_active', true)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

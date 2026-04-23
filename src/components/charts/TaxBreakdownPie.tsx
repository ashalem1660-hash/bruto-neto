'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CalculatorResult } from '@/lib/types'

interface Props {
  result: CalculatorResult
}

const COLORS = ['#10b981', '#F5C518', '#3b82f6', '#8b5cf6', '#ef4444']

const fmt = (v: number) => `₪${Math.round(v).toLocaleString('he-IL')}`

export function TaxBreakdownPie({ result }: Props) {
  const data = [
    { name: 'נטו', value: Math.max(0, result.netMonthly) },
    { name: 'מס הכנסה', value: Math.max(0, result.deductions.incomeTax.monthly) },
    { name: 'ביטוח לאומי', value: Math.max(0, result.deductions.bituachLeumi.monthly) },
    { name: 'ביטוח בריאות', value: Math.max(0, result.deductions.bituachBriut.monthly) },
    { name: 'פנסיה', value: Math.max(0, result.deductions.pension.monthly) }
  ].filter(d => d.value > 0)

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => fmt(Number(v))}
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
              direction: 'rtl'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

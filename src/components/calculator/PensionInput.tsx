'use client'

import { Slider } from '@/components/ui/Slider'
import { Tooltip } from '@/components/ui/Tooltip'

interface Props {
  value: number
  onChange: (v: number) => void
  isSelfEmployed?: boolean
  monthlyGross: number
}

export function PensionInput({ value, onChange, isSelfEmployed, monthlyGross }: Props) {
  const contribution = (monthlyGross * (value / 100)).toFixed(0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">הפרשה לפנסיה</span>
          <Tooltip content="הפרשה לפנסיה מקטינה את ההכנסה החייבת במס. שיעור מינימום לשכיר הוא 6%. ניתן לנכות עד 7% מההכנסה ועד לתקרה חודשית של ₪34,900." />
        </div>
        <span className="text-amber-400 font-bold">{value}%</span>
      </div>
      <Slider
        value={value}
        min={0}
        max={isSelfEmployed ? 16 : 10}
        step={0.5}
        onChange={onChange}
      />
      <div className="flex justify-between text-xs text-white/40">
        <span>10%</span>
        <span className="text-green-400/60">≈ ₪{Number(contribution).toLocaleString('he-IL')} לחודש</span>
        <span>0%</span>
      </div>
    </div>
  )
}

'use client'

import { Plus, X } from 'lucide-react'
import type { Child } from '@/lib/types'

interface Props {
  children: Child[]
  onChange: (children: Child[]) => void
}

export function ChildrenInput({ children, onChange }: Props) {
  const addChild = () => {
    const newChild: Child = {
      id: Math.random().toString(36).slice(2),
      birthYear: new Date().getFullYear() - 5,
      hasDisability: false,
      isInCustody: true
    }
    onChange([...children, newChild])
  }

  const removeChild = (id: string) => {
    onChange(children.filter(c => c.id !== id))
  }

  const updateChild = (id: string, updates: Partial<Child>) => {
    onChange(children.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-white/60">
          ילדים ({children.length})
        </label>
        <button
          onClick={addChild}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          הוסף ילד
        </button>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-4 text-white/30 text-sm border border-white/10 rounded-xl border-dashed">
          אין ילדים — לחץ הוסף ילד
        </div>
      ) : (
        <div className="space-y-2">
          {children.map((child, i) => {
            const age = currentYear - child.birthYear
            return (
              <div key={child.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-white/50">ילד {i + 1}</span>
                    <span className="text-xs text-amber-400/70">
                      {age === 0 ? 'נולד השנה' : `בן/בת ${age}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-xs text-white/40 block mb-1">שנת לידה</label>
                      <input
                        type="number"
                        value={child.birthYear}
                        min={currentYear - 25}
                        max={currentYear}
                        onChange={e => updateChild(child.id, { birthYear: Number(e.target.value) })}
                        className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-amber-500 text-center"
                        dir="ltr"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={child.hasDisability}
                        onChange={e => updateChild(child.id, { hasDisability: e.target.checked })}
                        className="w-4 h-4 rounded accent-amber-500"
                      />
                      נכות
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => removeChild(child.id)}
                  className="text-white/30 hover:text-red-400 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

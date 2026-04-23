'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (password === adminPass) {
      sessionStorage.setItem('admin_token', password)
      router.push('/admin')
    } else {
      setError('סיסמה שגויה')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A14' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #F5C518, #e6a800)' }}>
            <Lock className="w-8 h-8" style={{ color: '#0A0A14' }} />
          </div>
          <h1 className="text-2xl font-black text-white">כניסת אדמין</h1>
          <p className="text-white/40 text-sm mt-1">ברוטו לנטו — לוח ניהול</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="סיסמת אדמין"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors text-center"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: '#F5C518', color: '#0A0A14' }}
          >
            כניסה
          </button>
        </form>
        <div className="text-center mt-4">
          <a href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">← חזרה למחשבון</a>
        </div>
      </div>
    </div>
  )
}

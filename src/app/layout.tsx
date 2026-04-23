import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ברוטו לנטו | מחשבון מיסוי ישראלי 2025',
  description: 'חשב כמה נטו תקבל לאחר מסים — מס הכנסה, ביטוח לאומי, ביטוח בריאות. מחשבון מקצועי לשכירים ועצמאים.',
  openGraph: {
    title: 'ברוטו לנטו',
    description: 'מחשבון מיסוי ישראלי חכם לשכירים ועצמאים 2025',
    locale: 'he_IL'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-heebo">{children}</body>
    </html>
  )
}

import * as XLSX from 'xlsx'
import type { ParsedFile } from './types'

export async function parseFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (jsonData.length === 0) return { headers: [], rows: [], fileName: file.name }

  const headers = Object.keys(jsonData[0])
  const rows = jsonData.map(row =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        let str: string
        if (v instanceof Date) {
          str = v.toISOString().split('T')[0]
        } else {
          str = String(v ?? '')
        }
        return [k, str]
      })
    )
  )

  return { headers, rows, fileName: file.name }
}

export function parseNumber(value: string): number {
  const cleaned = value.replace(/[$,\s%]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function parseDate(value: string): string {
  if (!value || value.trim() === '') return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.split('T')[0]
  const date = new Date(value)
  if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  return value
}

export function deriveContractYears(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1
  const diffMs = end.getTime() - start.getTime()
  const years = diffMs / (365.25 * 24 * 60 * 60 * 1000)
  return Math.max(1, Math.round(years))
}

export function parseCommissionRate(value: string): number {
  const num = parseNumber(value)
  // If > 1, treat as percentage (e.g., 15 → 15%). If <= 1, treat as decimal (e.g., 0.15 → 15%)
  return num > 1 ? num : num * 100
}

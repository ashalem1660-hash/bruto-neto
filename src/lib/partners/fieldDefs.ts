import type { TargetField } from './types'

export interface FieldDef {
  key: TargetField
  label: string
  required: boolean
  description: string
  aliases: string[]
}

export const FIELD_DEFS: FieldDef[] = [
  {
    key: 'partnerName',
    label: 'שם שותף',
    required: true,
    description: 'שם חברת השותף / Reseller',
    aliases: ['partner', 'partner name', 'account', 'account name', 'company', 'vendor', 'reseller', 'שותף', 'חברה', 'account: account name', 'partner company'],
  },
  {
    key: 'dealId',
    label: 'מזהה עסקה',
    required: false,
    description: 'מזהה ייחודי מ-Salesforce',
    aliases: ['id', 'deal id', 'opportunity id', 'opp id', 'sf id', 'salesforce id', 'record id', 'opportunity id'],
  },
  {
    key: 'dealName',
    label: 'שם עסקה',
    required: false,
    description: 'שם ה-Opportunity',
    aliases: ['name', 'deal name', 'opportunity name', 'opp name', 'deal', 'opportunity'],
  },
  {
    key: 'closeDate',
    label: 'תאריך סגירה',
    required: false,
    description: 'תאריך סגירת העסקה',
    aliases: ['close date', 'closed date', 'close', 'close date/time', 'closedate', 'close_date', 'date closed'],
  },
  {
    key: 'dealAmount',
    label: 'סכום עסקה',
    required: false,
    description: 'ערך כולל של העסקה ($)',
    aliases: ['amount', 'deal amount', 'value', 'deal value', 'arr', 'total', 'contract value', 'tcv', 'acv', 'net amount', 'opportunity amount', 'total amount'],
  },
  {
    key: 'commissionRate',
    label: 'אחוז עמלה (%)',
    required: false,
    description: 'אחוז העמלה לשותף',
    aliases: ['commission', 'commission rate', 'commission %', 'rate', 'pct', 'percent', 'partner commission', 'reseller commission', 'commission_rate', 'rebate'],
  },
  {
    key: 'contractStartDate',
    label: 'תחילת חוזה',
    required: false,
    description: 'תאריך תחילת החוזה',
    aliases: ['start date', 'contract start', 'start', 'begin date', 'service start', 'subscription start', 'start_date', 'service start date', 'contract start date'],
  },
  {
    key: 'contractEndDate',
    label: 'סיום חוזה',
    required: false,
    description: 'תאריך סיום / חידוש החוזה',
    aliases: ['end date', 'contract end', 'end', 'expiry date', 'expiration date', 'service end', 'subscription end', 'renewal date', 'end_date', 'contract end date', 'expiration'],
  },
  {
    key: 'contractYears',
    label: 'שנות חוזה',
    required: false,
    description: 'כמה שנים נמשך החוזה',
    aliases: ['years', 'contract years', 'contract length', 'duration', 'term', 'contract term', 'term years', 'number of years'],
  },
  {
    key: 'currency',
    label: 'מטבע',
    required: false,
    description: 'USD, EUR, ILS...',
    aliases: ['currency', 'curr', 'currency code', 'מטבע'],
  },
]

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[_\-\/]/g, ' ').replace(/\s+/g, ' ')
}

export function autoMatch(headers: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {}
  const usedHeaders = new Set<string>()

  for (const field of FIELD_DEFS) {
    mapping[field.key] = null

    for (const header of headers) {
      if (usedHeaders.has(header)) continue
      const norm = normalize(header)
      const matched = field.aliases.some(alias => {
        const normAlias = normalize(alias)
        return norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)
      })
      if (matched) {
        mapping[field.key] = header
        usedHeaders.add(header)
        break
      }
    }
  }

  return mapping
}

export function getMatchConfidence(header: string, field: FieldDef): 'exact' | 'partial' | 'none' {
  const norm = normalize(header)
  for (const alias of field.aliases) {
    const normAlias = normalize(alias)
    if (norm === normAlias) return 'exact'
    if (norm.includes(normAlias) || normAlias.includes(norm)) return 'partial'
  }
  return 'none'
}

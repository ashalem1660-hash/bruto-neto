export type PaymentStatus = 'paid' | 'partial' | 'unpaid'

export type TargetField =
  | 'partnerName'
  | 'dealId'
  | 'dealName'
  | 'closeDate'
  | 'dealAmount'
  | 'commissionRate'
  | 'contractStartDate'
  | 'contractEndDate'
  | 'contractYears'
  | 'currency'

export interface Partner {
  id: string
  name: string
  emails: string[]
  notes: string
  createdAt: string
}

export interface Deal {
  id: string
  partnerId: string
  partnerName: string
  dealId: string
  dealName: string
  closeDate: string
  dealAmount: number
  commissionRate: number
  commissionAmount: number
  isMultiYear: boolean
  contractYears: number
  contractStartDate: string
  contractEndDate: string
  paymentStatus: PaymentStatus
  paidAmount: number
  currency: string
  notes: string
  importedAt: string
}

export interface BillingEvent {
  id: string
  dealId: string
  partnerId: string
  partnerName: string
  dealName: string
  yearNumber: number
  totalYears: number
  scheduledDate: string
  amount: number
  currency: string
  paymentStatus: PaymentStatus
  paidAmount: number
  reminderSent: boolean
}

export interface ImportSession {
  id: string
  fileName: string
  createdAt: string
  totalRows: number
  importedDeals: number
  columnMapping: Record<string, string | null>
}

export interface ParsedFile {
  headers: string[]
  rows: Record<string, string>[]
  fileName: string
}

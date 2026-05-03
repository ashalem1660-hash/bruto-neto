import type { Deal, BillingEvent } from './types'

export function generateBillingSchedule(deal: Deal): BillingEvent[] {
  const baseDate =
    deal.contractStartDate || deal.closeDate || new Date().toISOString().split('T')[0]

  if (!deal.isMultiYear || deal.contractYears <= 1) {
    return [
      {
        id: crypto.randomUUID(),
        dealId: deal.id,
        partnerId: deal.partnerId,
        partnerName: deal.partnerName,
        dealName: deal.dealName || deal.dealId || 'עסקה',
        yearNumber: 1,
        totalYears: 1,
        scheduledDate: baseDate,
        amount: deal.commissionAmount,
        currency: deal.currency || 'USD',
        paymentStatus: deal.paymentStatus,
        paidAmount: deal.paidAmount,
        reminderSent: false,
      },
    ]
  }

  const events: BillingEvent[] = []
  const startDate = new Date(baseDate)
  const annualCommission =
    Math.round((deal.commissionAmount / deal.contractYears) * 100) / 100

  for (let year = 1; year <= deal.contractYears; year++) {
    const scheduledDate = new Date(startDate)
    scheduledDate.setFullYear(scheduledDate.getFullYear() + (year - 1))

    events.push({
      id: crypto.randomUUID(),
      dealId: deal.id,
      partnerId: deal.partnerId,
      partnerName: deal.partnerName,
      dealName: deal.dealName || deal.dealId || 'עסקה',
      yearNumber: year,
      totalYears: deal.contractYears,
      scheduledDate: scheduledDate.toISOString().split('T')[0],
      amount: annualCommission,
      currency: deal.currency || 'USD',
      paymentStatus: year === 1 ? deal.paymentStatus : 'unpaid',
      paidAmount: year === 1 ? deal.paidAmount : 0,
      reminderSent: false,
    })
  }

  return events
}

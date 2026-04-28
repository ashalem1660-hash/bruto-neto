import {
  calculateIncomeTax,
  calculateBituachLeumiEmployee,
  calculateBituachBriut,
} from './tax-calculator'
import type { TaxParameters } from './types'
import type { JobOffer, PersonalProfile, OfferResult } from './compare-types'

// =============================================
// CREDIT POINTS — simplified for comparison
// =============================================
function calcCreditPoints(profile: PersonalProfile): number {
  if (profile.creditPointsOverride !== null) return profile.creditPointsOverride

  let pts = 2.25 // תושב ישראל
  if (profile.gender === 'female') pts += 0.5

  // ילדים — פשוט נניח גיל 6-17 (1 נקודה כל אחד)
  pts += profile.childrenCount * 1

  if (profile.isSingleParent && profile.childrenCount > 0) pts += 1

  return pts
}

// =============================================
// MARGINAL TAX RATE — highest active bracket
// =============================================
function getMarginalRate(annualIncome: number, brackets: TaxParameters['income_tax_brackets']): number {
  let rate = 0
  for (const b of brackets) {
    if (annualIncome > b.from) rate = b.rate
  }
  return rate
}

// =============================================
// MAIN CALCULATION
// =============================================
export function calculateOffer(
  offer: JobOffer,
  profile: PersonalProfile,
  params: TaxParameters
): OfferResult {
  const gross = offer.grossSalary

  // --- סיבוס ---
  const cibusMaxPerDay = 128 // פטור ממס עד ₪128/יום (₪2,820/חודש)
  const cibusMonthlyTotal = offer.cibusPerDay * offer.workDaysPerMonth
  const cibusMonthlyTaxFree = Math.min(offer.cibusPerDay, cibusMaxPerDay) * offer.workDaysPerMonth
  const cibusMonthlyTaxable = Math.max(0, cibusMonthlyTotal - cibusMonthlyTaxFree)

  // --- תחבורה ---
  const transportMaxMonthly = 500 // קירוב לתקרה הפטורה ממס
  const transportTaxFreeMonthly = Math.min(offer.transportationMonthly, transportMaxMonthly)
  const transportTaxableMonthly = Math.max(0, offer.transportationMonthly - transportMaxMonthly)

  // --- הכנסה חייבת חודשית (שכר + רכב + קו כסף + עודף סיבוס + עודף נסיעות) ---
  const taxableMonthly = gross + offer.carImputed + offer.carAllowance + cibusMonthlyTaxable + transportTaxableMonthly
  const annualTaxable = taxableMonthly * 12

  // --- ניכוי פנסיה מהכנסה חייבת ---
  const pensionCeiling = params.pension_max_salary_for_deduction
  const pensionEmployeeRate = offer.pensionEmployeeRate / 100
  const monthlyPensionEmployee = Math.min(gross, pensionCeiling) * pensionEmployeeRate
  const annualPensionDeductible = Math.min(gross, pensionCeiling) * Math.min(pensionEmployeeRate, 0.07) * 12

  const annualTaxableAfterPension = annualTaxable - annualPensionDeductible

  // --- נקודות זיכוי ---
  const creditPoints = calcCreditPoints(profile)

  // --- מס הכנסה ---
  const { netTax: annualIncomeTax, effectiveRate, bracketBreakdown } = calculateIncomeTax(
    annualTaxableAfterPension,
    params.income_tax_brackets,
    creditPoints,
    params.credit_point_value_monthly,
    null, // no settlement discount in comparison
    params.yishuv_mezake_income_ceiling
  )

  // זיכוי מס פנסיה
  const pensionTaxCredit = Math.min(monthlyPensionEmployee * 12 * 0.35, 9000)
  const finalIncomeTaxAnnual = Math.max(0, annualIncomeTax - pensionTaxCredit)
  const monthlyIncomeTax = finalIncomeTaxAnnual / 12

  // --- ביטוח לאומי + בריאות ---
  const bl = calculateBituachLeumiEmployee(
    taxableMonthly,
    params.bituach_leumi_employee_low_threshold,
    params.bituach_leumi_employee_low_rate,
    params.bituach_leumi_employee_high_rate,
    params.bituach_leumi_max_income
  )

  const bb = calculateBituachBriut(
    taxableMonthly,
    params.bituach_briut_threshold,
    params.bituach_briut_low_rate,
    params.bituach_briut_high_rate
  )

  // --- קרן השתלמות עובד ---
  const sfEmployeeMonthly = offer.hasStudyFund
    ? gross * (offer.studyFundEmployeeRate / 100)
    : 0

  // --- נטו מזומן חודשי ---
  // רכב חברה: שווי שימוש = מס נוסף בלי מזומן נוסף
  // קו כסף: מזומן שמתקבל (כבר חויב במס)
  const totalTaxesMonthly = monthlyIncomeTax + bl.monthly + bb.monthly
  const netSalaryMonthly = gross + offer.carAllowance - totalTaxesMonthly - monthlyPensionEmployee - sfEmployeeMonthly
  const netSalaryAnnual = netSalaryMonthly * 12

  // --- שיעור שולי ---
  const marginalRate = getMarginalRate(annualTaxableAfterPension, params.income_tax_brackets)

  // --- בונוס ---
  const annualBonusGross = offer.annualBonusFixed + (gross * 12 * offer.annualBonusPct / 100)
  // בונוס: מס שולי + NI (קירוב: מס שולי בלבד כי NI כבר בתקרה לרוב)
  const annualBonusNet = annualBonusGross * (1 - Math.min(marginalRate + 0.12, 0.62))

  // --- אקוויטי ---
  const annualEquityGross = offer.rsuAnnualValue + offer.optionsAnnualValue
  let annualEquityNet = 0
  if (offer.rsuTaxType === 'section102') {
    // סעיף 102 רווחי הון — 25%
    annualEquityNet = annualEquityGross * 0.75
  } else {
    // הכנסת עבודה — שיעור שולי
    annualEquityNet = annualEquityGross * (1 - Math.min(marginalRate + 0.12, 0.62))
  }

  // --- הטבות פטורות ממס ---
  const officeMealsMonthly = offer.officeMeals
    ? offer.officeMealsPerDay * 50 * offer.workDaysPerMonth // ₪50 לארוחה
    : 0

  const extraVacationDays = Math.max(0, offer.vacationDays - 12)
  const dailySalary = gross / offer.workDaysPerMonth
  const extraVacationAnnual = extraVacationDays * dailySalary

  const taxFreePerks = {
    cibus: cibusMonthlyTaxFree * 12,
    officeMeals: officeMealsMonthly * 12,
    healthInsurance: offer.healthInsuranceMonthly * 12,
    lifeInsurance: offer.lifeInsuranceMonthly * 12,
    welfare: offer.welfareAnnualBudget,
    gym: offer.gymMonthly * 12,
    training: offer.trainingAnnual,
    equipment: offer.equipmentAnnual,
    phone: offer.phoneMonthly * 12,
    parking: offer.parkingMonthly * 12,
    transportation: transportTaxFreeMonthly * 12,
    childcare: offer.childcareMonthly * 12,
    extraVacation: extraVacationAnnual,
  }
  const taxFreePerksTotal = Object.values(taxFreePerks).reduce((s, v) => s + v, 0)

  // --- חיסכון נצבר ---
  const pensionCeilingEff = Math.min(gross, pensionCeiling)
  const pensionEmployerMonthly = pensionCeilingEff * (offer.pensionEmployerRate / 100)
  const pensionSeveranceMonthly = pensionCeilingEff * 0.06 // פיצויים 6%
  const annualPensionAccrual = (monthlyPensionEmployee + pensionEmployerMonthly + pensionSeveranceMonthly) * 12

  const sfCeiling = params.study_fund_max_salary
  const sfEmployerMonthly = offer.hasStudyFund
    ? Math.min(gross, sfCeiling) * (offer.studyFundEmployerRate / 100)
    : 0
  const annualStudyFundAccrual = (sfEmployeeMonthly + sfEmployerMonthly) * 12

  // --- סיכומים ---
  const totalLiquidAnnual = netSalaryAnnual + annualBonusNet + annualEquityNet + taxFreePerksTotal
  const totalWithSavingsAnnual = totalLiquidAnnual + annualPensionAccrual + annualStudyFundAccrual

  return {
    offerId: offer.id,
    taxableMonthly,
    netSalaryMonthly,
    netSalaryAnnual,
    effectiveTaxRate: effectiveRate,
    marginalTaxRate: marginalRate,
    annualBonusGross,
    annualBonusNet,
    annualEquityGross,
    annualEquityNet,
    taxFreePerks,
    taxFreePerksTotal,
    annualPensionAccrual,
    annualStudyFundAccrual,
    totalLiquidAnnual,
    totalWithSavingsAnnual,
    signOnBonus: offer.signOnBonus,
  }
}

import type {
  TaxParameters, CalculatorInput, CalculatorResult,
  CreditBreakdownItem, TaxBracket, TaxBracketBreakdown,
  EmployerCostBreakdown, StudyFundResult, PensionProjection, SelfEmployedPensionTax
} from './types'

// =============================================
// CREDIT POINTS
// =============================================
export function calculateCreditPoints(input: CalculatorInput): {
  points: number
  breakdown: CreditBreakdownItem[]
} {
  const breakdown: CreditBreakdownItem[] = []
  let base = 2.25
  breakdown.push({ label: 'תושב ישראל (בסיס)', points: 2.25 })

  if (input.gender === 'female') {
    breakdown.push({ label: 'אישה', points: 0.5 })
    base += 0.5
  }

  const currentYear = new Date().getFullYear()
  for (const child of input.children) {
    const childAge = currentYear - child.birthYear
    let childPoints = 0
    let childLabel = ''

    if (childAge === 0) {
      childPoints = input.gender === 'female' ? 1.5 : 1
      childLabel = `ילד שנולד ${currentYear}`
    } else if (childAge === 1 || childAge === 2) {
      childPoints = input.gender === 'female' ? 4.5 : 2
      childLabel = `ילד בן ${childAge}`
    } else if (childAge === 3) {
      childPoints = input.gender === 'female' ? 3.5 : 1
      childLabel = 'ילד בן 3'
    } else if (childAge === 4 || childAge === 5) {
      childPoints = input.gender === 'female' ? 2.5 : 1
      childLabel = `ילד בן ${childAge}`
    } else if (childAge >= 6 && childAge < 18) {
      childPoints = 1
      childLabel = `ילד בן ${childAge}`
    }

    if (child.hasDisability) {
      childPoints += 2
      childLabel += ' (נכות)'
    }

    if (childPoints > 0) {
      breakdown.push({ label: childLabel, points: childPoints })
      base += childPoints
    }
  }

  if (input.isSingleParent && input.children.length > 0) {
    breakdown.push({ label: 'הורה יחיד', points: 1 })
    base += 1
  }

  if (input.paysMaintenance) {
    breakdown.push({ label: 'תשלום מזונות', points: 1 })
    base += 1
  }

  if (input.spouseNotWorking && (input.age >= 67 || input.disability.percentage >= 90 || input.disability.isBlind)) {
    breakdown.push({ label: 'בן/ת זוג שאינו עובד', points: 1 })
    base += 1
  }

  if (input.disability.hasDisability) {
    if (input.disability.percentage >= 100 || input.disability.isBlind) {
      breakdown.push({ label: 'נכות 100% / עיוורון', points: 2 })
      base += 2
    } else if (input.disability.percentage >= 90) {
      breakdown.push({ label: 'נכות 90%+', points: 2 })
      base += 2
    } else if (input.disability.percentage >= 50) {
      breakdown.push({ label: `נכות ${input.disability.percentage}%`, points: 1 })
      base += 1
    }
  }

  if (input.isNewImmigrant) {
    breakdown.push({ label: 'עולה חדש', points: 3 })
    base += 3
  }

  if (input.isVeteran) {
    breakdown.push({ label: 'חייל/ת משוחרר/ת (שירות חובה)', points: 1 })
    base += 1
  }

  if (input.hasBachelors && input.bachelorGraduationYear >= 2023) {
    const yearsSince = currentYear - input.bachelorGraduationYear
    if (yearsSince >= 1 && yearsSince <= 3) {
      breakdown.push({ label: `תואר ראשון (שנה ${yearsSince} מתוך 3)`, points: 1 })
      base += 1
    }
  }

  if (input.hasMasters && input.masterGraduationYear >= 2005) {
    const yearsSince = currentYear - input.masterGraduationYear
    if (yearsSince >= 1) {
      breakdown.push({ label: 'תואר שני', points: 0.5 })
      base += 0.5
    }
  }

  return { points: base, breakdown }
}

// =============================================
// INCOME TAX
// =============================================
function calculateTaxOnAmount(income: number, brackets: TaxBracket[]): number {
  let tax = 0
  for (const b of brackets) {
    const from = b.from
    const to = b.to ?? Infinity
    if (income <= from) break
    tax += (Math.min(income, to) - from) * b.rate
  }
  return tax
}

export function calculateIncomeTax(
  annualIncome: number,
  brackets: TaxBracket[],
  creditPoints: number,
  creditPointValueMonthly: number,
  settlementCategory: 'A' | 'B' | null,
  settlementIncomeCeiling: number
): {
  grossTax: number
  creditAmount: number
  settlementDiscount: number
  netTax: number
  effectiveRate: number
  bracketBreakdown: TaxBracketBreakdown[]
} {
  let grossTax = 0
  const bracketBreakdown: TaxBracketBreakdown[] = []

  for (const bracket of brackets) {
    const from = bracket.from
    const to = bracket.to ?? Infinity
    if (annualIncome <= from) {
      bracketBreakdown.push({ bracket: `${Math.round(bracket.rate * 100)}%`, income: 0, tax: 0, rate: bracket.rate, isActive: false, from, to: bracket.to })
      continue
    }
    const taxableInThisBracket = Math.min(annualIncome, to) - from
    const taxForBracket = taxableInThisBracket * bracket.rate
    grossTax += taxForBracket
    bracketBreakdown.push({ bracket: `${Math.round(bracket.rate * 100)}%`, income: taxableInThisBracket, tax: taxForBracket, rate: bracket.rate, isActive: true, from, to: bracket.to })
  }

  const creditAmount = creditPoints * creditPointValueMonthly * 12

  let settlementDiscount = 0
  if (settlementCategory) {
    const discountRate = settlementCategory === 'A' ? 0.20 : 0.10
    const eligibleIncome = Math.min(annualIncome, settlementIncomeCeiling)
    const taxOnEligibleIncome = calculateTaxOnAmount(eligibleIncome, brackets)
    settlementDiscount = taxOnEligibleIncome * discountRate
  }

  const netTax = Math.max(0, grossTax - creditAmount - settlementDiscount)
  const effectiveRate = annualIncome > 0 ? netTax / annualIncome : 0

  return { grossTax, creditAmount, settlementDiscount, netTax, effectiveRate, bracketBreakdown }
}

// =============================================
// BITUACH LEUMI — EMPLOYEE
// =============================================
export function calculateBituachLeumiEmployee(
  monthlyGross: number,
  lowThreshold: number,
  lowRate: number,
  highRate: number,
  maxIncome: number
): { monthly: number; annual: number } {
  const capped = Math.min(monthlyGross, maxIncome)
  let amount = 0
  if (capped <= lowThreshold) {
    amount = capped * lowRate
  } else {
    amount = lowThreshold * lowRate + (capped - lowThreshold) * highRate
  }
  return { monthly: amount, annual: amount * 12 }
}

// =============================================
// BITUACH BRIUT
// =============================================
export function calculateBituachBriut(
  monthlyGross: number,
  threshold: number,
  lowRate: number,
  highRate: number
): { monthly: number; annual: number } {
  let amount = 0
  if (monthlyGross <= threshold) {
    amount = monthlyGross * lowRate
  } else {
    amount = threshold * lowRate + (monthlyGross - threshold) * highRate
  }
  return { monthly: amount, annual: amount * 12 }
}

// =============================================
// BITUACH LEUMI — SELF EMPLOYED
// =============================================
export function calculateBituachLeumiSelfEmployed(
  monthlyNetIncome: number,
  avgWage: number,
  lowRate: number,
  highRate: number,
  maxIncome: number
): { monthly: number; annual: number } {
  const lowThreshold = avgWage * 0.6
  const capped = Math.min(monthlyNetIncome, maxIncome)
  let amount = 0
  if (capped <= lowThreshold) {
    amount = capped * lowRate
  } else {
    amount = lowThreshold * lowRate + (capped - lowThreshold) * highRate
  }
  return { monthly: amount, annual: amount * 12 }
}

// =============================================
// EMPLOYER COST (ביטוח לאומי מעסיק + פנסיה + פיצויים + השתלמות)
// =============================================
export function calculateEmployerCost(
  monthlyGross: number,
  hasStudyFund: boolean,
  params: TaxParameters
): EmployerCostBreakdown {
  const pensionCeiling = params.pension_max_salary_for_deduction
  const effectivePension = Math.min(monthlyGross, pensionCeiling)

  const pensionEmployer = effectivePension * params.pension_employer_rate       // 6.5%
  const severancePay = effectivePension * params.pension_employer_pitzuim_rate  // 6%

  const studyFundCeiling = params.study_fund_max_salary
  const studyFundEmployer = hasStudyFund
    ? Math.min(monthlyGross, studyFundCeiling) * params.study_fund_employer_rate
    : 0

  // ביטוח לאומי מעסיק
  const blMax = params.bituach_leumi_max_income
  const capped = Math.min(monthlyGross, blMax)
  let bituachLeumiEmployer = 0
  if (capped <= params.bl_employer_threshold) {
    bituachLeumiEmployer = capped * params.bl_employer_low_rate
  } else {
    bituachLeumiEmployer =
      params.bl_employer_threshold * params.bl_employer_low_rate +
      (capped - params.bl_employer_threshold) * params.bl_employer_high_rate
  }

  const totalEmployerCost = monthlyGross + pensionEmployer + severancePay + studyFundEmployer + bituachLeumiEmployer
  const totalAccruingMonthly = pensionEmployer + severancePay + studyFundEmployer

  return {
    grossSalary: monthlyGross,
    pensionEmployer,
    severancePay,
    studyFundEmployer,
    bituachLeumiEmployer,
    totalEmployerCost,
    totalAccruingMonthly
  }
}

// =============================================
// STUDY FUND — EMPLOYEE
// =============================================
export function calculateStudyFund(
  monthlyGross: number,
  employeeRate: number,   // 2.5%
  employerRate: number,   // 7.5%
  maxSalary: number       // 15,712 ₪
): StudyFundResult {
  const effectiveSalary = Math.min(monthlyGross, maxSalary)
  const employeeContribution = monthlyGross * employeeRate
  const employerContribution = effectiveSalary * employerRate
  const isExempt = monthlyGross <= maxSalary

  return {
    employeeContribution,
    employerContribution,
    total: employeeContribution + employerContribution,
    annualAccrual: (employeeContribution + employerContribution) * 12,
    isExempt
  }
}

// =============================================
// PENSION PROJECTION
// =============================================
export function calculatePensionProjection(
  monthlyAccrual: number,
  currentAge: number,
  retirementAge: number,
  annualReturnPct: number,    // כ-% (לא עשרוני)
  existingBalance: number,
  lifeExpectancy: number = 85
): PensionProjection {
  const annualReturn = annualReturnPct / 100
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const monthlyReturn = annualReturn / 12
  const months = yearsToRetirement * 12

  const existingGrowth = existingBalance * Math.pow(1 + annualReturn, yearsToRetirement)

  const futureValue = monthlyReturn > 0
    ? monthlyAccrual * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn)
    : monthlyAccrual * months

  const projectedBalance = existingGrowth + futureValue

  const retirementMonths = Math.max(1, (lifeExpectancy - retirementAge) * 12)
  const estimatedMonthlyPension = projectedBalance / retirementMonths

  return {
    projectedBalance,
    estimatedMonthlyPension,
    yearsToRetirement,
    totalContributions: monthlyAccrual * months,
    monthlyAccrual
  }
}

// =============================================
// SELF EMPLOYED — PENSION TAX SAVING
// =============================================
export function calculateSelfEmployedPensionTaxSaving(
  annualIncome: number,
  annualPensionContribution: number,
  marginalTaxRate: number
): SelfEmployedPensionTax {
  const maxDeductibleIncome = 34900 * 12  // 418,800 ₪

  const maxDeduction47 = Math.min(annualIncome, maxDeductibleIncome) * 0.11
  const actualDeduction47 = Math.min(annualPensionContribution, maxDeduction47)
  const taxSavingFromDeduction = actualDeduction47 * marginalTaxRate

  const maxCredit45a = Math.min(annualIncome, maxDeductibleIncome) * 0.05
  const credit45a = Math.min(annualPensionContribution * 0.05, maxCredit45a)

  const totalTaxSaving = taxSavingFromDeduction + credit45a
  const effectiveAnnualCost = annualPensionContribution - totalTaxSaving

  return { deduction47: actualDeduction47, credit45a, totalTaxSaving, effectiveAnnualCost }
}

// =============================================
// MAIN — EMPLOYEE
// =============================================
export function calculateEmployeeNet(input: CalculatorInput, params: TaxParameters): CalculatorResult {
  const monthlyGross = input.grossIncome
  const annualGross = monthlyGross * 12

  const { points: creditPoints, breakdown: creditBreakdown } = calculateCreditPoints(input)

  // פנסיה עובד
  const pensionRate = input.pensionRate / 100
  const pensionCeiling = params.pension_max_salary_for_deduction
  const monthlyPensionEmployee = Math.min(monthlyGross, pensionCeiling) * pensionRate

  // ניכוי פנסיה מהכנסה חייבת (עד 7%)
  const pensionDeductibleRate = Math.min(pensionRate, 0.07)
  const annualPensionDeductible = Math.min(monthlyGross, pensionCeiling) * pensionDeductibleRate * 12

  // קרן השתלמות עובד (ניכוי מהנטו)
  let studyFundResult: StudyFundResult | undefined
  let monthlyStudyFundEmployee = 0
  if (input.hasStudyFund) {
    studyFundResult = calculateStudyFund(
      monthlyGross,
      input.studyFundEmployeeRate / 100,
      input.studyFundEmployerRate / 100,
      params.study_fund_max_salary
    )
    monthlyStudyFundEmployee = studyFundResult.employeeContribution
  }

  const taxableIncome = annualGross - annualPensionDeductible

  const { netTax: annualIncomeTax, grossTax, creditAmount, settlementDiscount, effectiveRate, bracketBreakdown } =
    calculateIncomeTax(
      taxableIncome,
      params.income_tax_brackets,
      creditPoints,
      params.credit_point_value_monthly,
      input.settlement.isRecognized ? input.settlement.category : null,
      params.yishuv_mezake_income_ceiling
    )

  const pensionTaxCredit = Math.min(monthlyPensionEmployee * 12 * 0.35, 9000)
  const finalIncomeTax = Math.max(0, annualIncomeTax - pensionTaxCredit)
  const monthlyIncomeTax = finalIncomeTax / 12

  const bl = calculateBituachLeumiEmployee(
    monthlyGross,
    params.bituach_leumi_employee_low_threshold,
    params.bituach_leumi_employee_low_rate,
    params.bituach_leumi_employee_high_rate,
    params.bituach_leumi_max_income
  )

  const bb = calculateBituachBriut(
    monthlyGross,
    params.bituach_briut_threshold,
    params.bituach_briut_low_rate,
    params.bituach_briut_high_rate
  )

  const totalDeductions = monthlyIncomeTax + bl.monthly + bb.monthly + monthlyPensionEmployee + monthlyStudyFundEmployee
  const netMonthly = monthlyGross - totalDeductions
  const netPercent = (netMonthly / monthlyGross) * 100

  // עלות מעסיק
  const employerCost = calculateEmployerCost(monthlyGross, input.hasStudyFund, params)

  // פרויקציה פנסיונית
  const totalPensionMonthly = monthlyPensionEmployee + employerCost.pensionEmployer + employerCost.severancePay
  const pensionProjection = calculatePensionProjection(
    totalPensionMonthly,
    input.age,
    input.retirementAge,
    input.pensionReturnRate,
    input.existingPensionBalance
  )

  return {
    employeeType: 'employee',
    grossMonthly: monthlyGross,
    grossAnnual: annualGross,
    netMonthly,
    netAnnual: netMonthly * 12,
    netPercent,
    deductions: {
      incomeTax: { monthly: monthlyIncomeTax, annual: finalIncomeTax, rate: effectiveRate },
      bituachLeumi: { monthly: bl.monthly, annual: bl.annual },
      bituachBriut: { monthly: bb.monthly, annual: bb.annual },
      pension: { monthly: monthlyPensionEmployee, annual: monthlyPensionEmployee * 12 },
      ...(input.hasStudyFund && studyFundResult ? {
        studyFundEmployee: { monthly: monthlyStudyFundEmployee, annual: monthlyStudyFundEmployee * 12 }
      } : {})
    },
    creditPoints,
    creditBreakdown,
    taxBreakdown: bracketBreakdown,
    creditAmount,
    grossTaxBeforeCredits: grossTax,
    settlementDiscount,
    pensionTaxCredit,
    employerCost,
    studyFund: studyFundResult,
    pensionProjection
  }
}

// =============================================
// MAIN — SELF EMPLOYED
// =============================================
export function calculateSelfEmployedNet(input: CalculatorInput, params: TaxParameters): CalculatorResult {
  const annualRevenue = input.annualRevenue
  const annualExpenses = input.annualExpenses
  const netAnnualIncome = annualRevenue - annualExpenses
  const monthlyNetIncome = netAnnualIncome / 12

  const pensionSelfRate = input.pensionSelfRate / 100
  const annualPensionSelf = Math.min(monthlyNetIncome, params.pension_max_salary_for_deduction) * pensionSelfRate * 12

  const taxableIncome = netAnnualIncome - annualPensionSelf

  const { points: creditPoints, breakdown: creditBreakdown } = calculateCreditPoints(input)

  const { netTax: annualIncomeTax, grossTax, creditAmount, settlementDiscount, effectiveRate, bracketBreakdown } =
    calculateIncomeTax(
      taxableIncome,
      params.income_tax_brackets,
      creditPoints,
      params.credit_point_value_monthly,
      input.settlement.isRecognized ? input.settlement.category : null,
      params.yishuv_mezake_income_ceiling
    )

  const pensionTaxCredit = Math.min(annualPensionSelf * 0.35, 9000)
  const finalIncomeTax = Math.max(0, annualIncomeTax - pensionTaxCredit)
  const monthlyIncomeTax = finalIncomeTax / 12

  const bl = calculateBituachLeumiSelfEmployed(
    monthlyNetIncome, 12536,
    params.bituach_leumi_self_low_rate,
    params.bituach_leumi_self_high_rate,
    params.bituach_leumi_max_income
  )

  const bb = calculateBituachBriut(
    monthlyNetIncome,
    params.bituach_briut_threshold,
    params.bituach_briut_self_low_rate,
    params.bituach_briut_self_high_rate
  )

  const monthlyPension = annualPensionSelf / 12
  // אובדן כושר עבודה מנוכה מהנטו (הוצאה מוכרת)
  const monthlyDisabilityInsurance = input.disabilityInsuranceCost
  const totalDeductionsMonthly = monthlyIncomeTax + bl.monthly + bb.monthly + monthlyPension + monthlyDisabilityInsurance
  const netMonthly = monthlyNetIncome - totalDeductionsMonthly
  const netPercent = netAnnualIncome > 0 ? (netMonthly / monthlyNetIncome) * 100 : 0

  // חיסכון מס על פנסיה לעצמאי
  const marginalRate = effectiveRate + 0.1  // קירוב לשיעור שולי
  const selfPensionTax = calculateSelfEmployedPensionTaxSaving(netAnnualIncome, annualPensionSelf, Math.min(marginalRate, 0.47))

  // פרויקציה פנסיונית
  const pensionProjection = calculatePensionProjection(
    monthlyPension,
    input.age,
    input.retirementAge,
    input.pensionReturnRate,
    input.existingPensionBalance
  )

  // קרן השתלמות עצמאי
  let studyFundResult: StudyFundResult | undefined
  if (input.hasStudyFundSelf) {
    const selfStudyFundAnnual = Math.min(netAnnualIncome, 293397) * 0.045
    const selfStudyFundMonthly = selfStudyFundAnnual / 12
    studyFundResult = {
      employeeContribution: selfStudyFundMonthly,
      employerContribution: 0,
      total: selfStudyFundMonthly,
      annualAccrual: selfStudyFundAnnual,
      isExempt: true
    }
  }

  return {
    employeeType: 'self_employed',
    grossMonthly: monthlyNetIncome,
    grossAnnual: netAnnualIncome,
    netMonthly,
    netAnnual: netMonthly * 12,
    netPercent,
    deductions: {
      incomeTax: { monthly: monthlyIncomeTax, annual: finalIncomeTax, rate: effectiveRate },
      bituachLeumi: { monthly: bl.monthly, annual: bl.annual },
      bituachBriut: { monthly: bb.monthly, annual: bb.annual },
      pension: { monthly: monthlyPension, annual: annualPensionSelf }
    },
    creditPoints,
    creditBreakdown,
    taxBreakdown: bracketBreakdown,
    creditAmount,
    grossTaxBeforeCredits: grossTax,
    settlementDiscount,
    pensionTaxCredit,
    pensionProjection,
    studyFund: studyFundResult,
    selfEmployedPensionTax: selfPensionTax,
    selfEmployedExtra: { annualRevenue, annualExpenses, netAnnualIncome }
  }
}

export function calculate(input: CalculatorInput, params: TaxParameters): CalculatorResult {
  if (input.employeeType === 'employee') return calculateEmployeeNet(input, params)
  return calculateSelfEmployedNet(input, params)
}

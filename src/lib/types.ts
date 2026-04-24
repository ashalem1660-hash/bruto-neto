export interface TaxBracket {
  from: number
  to: number | null
  rate: number
  label: string
}

export interface TaxParameters {
  id: string
  year: number
  income_tax_brackets: TaxBracket[]
  credit_point_value_monthly: number
  // ביטוח לאומי שכיר
  bituach_leumi_employee_low_threshold: number
  bituach_leumi_employee_low_rate: number
  bituach_leumi_employee_high_rate: number
  bituach_leumi_max_income: number
  // ביטוח לאומי מעסיק
  bl_employer_low_rate: number
  bl_employer_high_rate: number
  bl_employer_threshold: number
  // ביטוח לאומי עצמאי
  bituach_leumi_self_low_rate: number
  bituach_leumi_self_high_rate: number
  // ביטוח בריאות שכיר
  bituach_briut_low_rate: number
  bituach_briut_high_rate: number
  bituach_briut_threshold: number
  // ביטוח בריאות עצמאי
  bituach_briut_self_low_rate: number
  bituach_briut_self_high_rate: number
  // מס יסף
  mas_yasaf_threshold_annual: number
  mas_yasaf_rate: number
  // יישוב מזכה
  yishuv_mezake_rates: { A: number; B: number }
  yishuv_mezake_income_ceiling: number
  // פנסיה — עובד
  pension_employee_rate: number
  pension_employer_rate: number           // תגמולים מעסיק
  pension_employer_pitzuim_rate: number   // פיצויים
  pension_max_salary_for_deduction: number
  // קרן השתלמות שכיר
  study_fund_employer_rate: number        // 7.5%
  study_fund_employee_rate: number        // 2.5%
  study_fund_max_salary: number           // 15,712 ₪
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Settlement {
  id: string
  name: string
  category: 'A' | 'B'
  is_active: boolean
}

export interface SelfEmployedDeduction {
  id: string
  name: string
  description: string | null
  max_amount: number | null
  rate: number | null
  is_active: boolean
  sort_order: number
}

export interface Child {
  id: string
  birthYear: number
  hasDisability: boolean
  isInCustody: boolean
}

export interface CalculatorInput {
  employeeType: 'employee' | 'self_employed'
  gender: 'male' | 'female'
  grossIncome: number

  age: number
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  isNewImmigrant: boolean
  isReturningResident: boolean

  children: Child[]

  disability: {
    hasDisability: boolean
    percentage: number
    isBlind: boolean
  }

  settlement: {
    isRecognized: boolean
    category: 'A' | 'B' | null
    name: string
  }

  // שכיר
  pensionRate: number
  hasStudyFund: boolean
  studyFundEmployerRate: number    // ברירת מחדל 7.5
  studyFundEmployeeRate: number    // ברירת מחדל 2.5
  existingPensionBalance: number   // צבירה קיימת
  retirementAge: number            // גיל פרישה
  pensionReturnRate: number        // תשואה שנתית צפויה %
  studyFund: number
  hasTravelAllowance: boolean
  travelAllowance: number
  isSingleParent: boolean
  paysMaintenance: boolean
  spouseNotWorking: boolean
  isVeteran: boolean
  hasBachelors: boolean
  bachelorGraduationYear: number
  hasMasters: boolean
  masterGraduationYear: number

  // עצמאי
  annualRevenue: number
  annualExpenses: number
  isVatExempt: boolean
  vatObligated: boolean
  pensionSelfRate: number
  studyFundSelf: number
  hasStudyFundSelf: boolean
  disabilityInsuranceCost: number  // אובדן כושר עבודה
}

export interface DeductionDetail {
  monthly: number
  annual: number
  rate?: number
}

export interface TaxBracketBreakdown {
  bracket: string
  income: number
  tax: number
  rate: number
  isActive: boolean
  from: number
  to: number | null
}

export interface CreditBreakdownItem {
  label: string
  points: number
}

export interface EmployerCostBreakdown {
  grossSalary: number
  pensionEmployer: number
  severancePay: number
  studyFundEmployer: number
  bituachLeumiEmployer: number
  totalEmployerCost: number
  totalAccruingMonthly: number    // מה נצבר לעובד בחודש
}

export interface StudyFundResult {
  employeeContribution: number
  employerContribution: number
  total: number
  annualAccrual: number
  isExempt: boolean
}

export interface PensionProjection {
  projectedBalance: number
  estimatedMonthlyPension: number
  yearsToRetirement: number
  totalContributions: number
  monthlyAccrual: number
}

export interface SelfEmployedPensionTax {
  deduction47: number
  credit45a: number
  totalTaxSaving: number
  effectiveAnnualCost: number
}

export interface CalculatorResult {
  employeeType: 'employee' | 'self_employed'
  grossMonthly: number
  grossAnnual: number
  netMonthly: number
  netAnnual: number
  netPercent: number
  deductions: {
    incomeTax: DeductionDetail
    bituachLeumi: DeductionDetail
    bituachBriut: DeductionDetail
    pension: DeductionDetail
    studyFundEmployee?: DeductionDetail
  }
  creditPoints: number
  creditBreakdown: CreditBreakdownItem[]
  taxBreakdown: TaxBracketBreakdown[]
  creditAmount: number
  grossTaxBeforeCredits: number
  settlementDiscount: number
  pensionTaxCredit: number
  employerCost?: EmployerCostBreakdown
  studyFund?: StudyFundResult
  pensionProjection?: PensionProjection
  selfEmployedPensionTax?: SelfEmployedPensionTax
  selfEmployedExtra?: {
    annualRevenue: number
    annualExpenses: number
    netAnnualIncome: number
  }
}

export interface TaxApiResponse {
  params: TaxParameters
  settlements: Settlement[]
  deductions: SelfEmployedDeduction[]
}

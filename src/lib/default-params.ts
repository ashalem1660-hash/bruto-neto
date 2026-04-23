import type { TaxParameters, Settlement } from './types'

export const DEFAULT_TAX_PARAMS: TaxParameters = {
  id: 'default',
  year: 2025,
  income_tax_brackets: [
    { from: 0,      to: 81480,   rate: 0.10, label: 'מדרגה 1' },
    { from: 81480,  to: 116760,  rate: 0.14, label: 'מדרגה 2' },
    { from: 116760, to: 188280,  rate: 0.20, label: 'מדרגה 3' },
    { from: 188280, to: 269280,  rate: 0.31, label: 'מדרגה 4' },
    { from: 269280, to: 560280,  rate: 0.35, label: 'מדרגה 5' },
    { from: 560280, to: 721560,  rate: 0.47, label: 'מדרגה 6' },
    { from: 721560, to: null,    rate: 0.50, label: 'מדרגה 7' }
  ],
  credit_point_value_monthly: 242,
  // ביטוח לאומי שכיר
  bituach_leumi_employee_low_threshold: 7522,
  bituach_leumi_employee_low_rate: 0.0555,
  bituach_leumi_employee_high_rate: 0.12,
  bituach_leumi_max_income: 50695,
  // ביטוח לאומי מעסיק
  bl_employer_low_rate: 0.0355,
  bl_employer_high_rate: 0.076,
  bl_employer_threshold: 7703,
  // ביטוח לאומי עצמאי
  bituach_leumi_self_low_rate: 0.0647,
  bituach_leumi_self_high_rate: 0.18,
  // ביטוח בריאות שכיר
  bituach_briut_low_rate: 0.0323,
  bituach_briut_high_rate: 0.0517,
  bituach_briut_threshold: 7703,
  // ביטוח בריאות עצמאי
  bituach_briut_self_low_rate: 0.0323,
  bituach_briut_self_high_rate: 0.0517,
  // מס יסף
  mas_yasaf_threshold_annual: 721560,
  mas_yasaf_rate: 0.03,
  // יישוב מזכה
  yishuv_mezake_rates: { A: 0.20, B: 0.10 },
  yishuv_mezake_income_ceiling: 199000,
  // פנסיה שכיר
  pension_employee_rate: 0.06,
  pension_employer_rate: 0.065,
  pension_employer_pitzuim_rate: 0.06,
  pension_max_salary_for_deduction: 34900,
  // קרן השתלמות שכיר
  study_fund_employer_rate: 0.075,
  study_fund_employee_rate: 0.025,
  study_fund_max_salary: 15712,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const DEFAULT_SETTLEMENTS: Settlement[] = [
  { id: '1',  name: 'אילת',           category: 'A', is_active: true },
  { id: '2',  name: 'מצפה רמון',      category: 'A', is_active: true },
  { id: '3',  name: 'ירוחם',          category: 'A', is_active: true },
  { id: '4',  name: 'דימונה',         category: 'A', is_active: true },
  { id: '5',  name: 'ערד',            category: 'A', is_active: true },
  { id: '6',  name: 'קריית שמונה',    category: 'A', is_active: true },
  { id: '7',  name: 'מעלות-תרשיחא',  category: 'A', is_active: true },
  { id: '8',  name: 'אופקים',         category: 'A', is_active: true },
  { id: '9',  name: 'נתיבות',         category: 'A', is_active: true },
  { id: '10', name: 'שדרות',          category: 'A', is_active: true },
  { id: '11', name: 'יוקנעם עילית',   category: 'B', is_active: true },
  { id: '12', name: 'כרמיאל',         category: 'B', is_active: true },
  { id: '13', name: 'צפת',            category: 'B', is_active: true },
  { id: '14', name: 'נהריה',          category: 'B', is_active: true },
  { id: '15', name: 'עכו',            category: 'B', is_active: true },
  { id: '16', name: 'בית שאן',        category: 'B', is_active: true },
  { id: '17', name: 'טבריה',          category: 'B', is_active: true },
  { id: '18', name: 'אשקלון',         category: 'B', is_active: true },
  { id: '19', name: 'באר שבע',        category: 'B', is_active: true },
  { id: '20', name: 'בית שמש',        category: 'B', is_active: true },
  { id: '21', name: 'אלעד',           category: 'B', is_active: true },
  { id: '22', name: 'מודיעין עילית',  category: 'B', is_active: true },
  { id: '23', name: 'ביתר עילית',     category: 'B', is_active: true },
  { id: '24', name: 'רהט',            category: 'A', is_active: true }
]

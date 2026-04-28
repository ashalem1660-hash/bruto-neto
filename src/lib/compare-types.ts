export type OfferColor = 'violet' | 'green' | 'blue' | 'orange'

export const OFFER_COLORS: Record<OfferColor, { bg: string; border: string; text: string; light: string; hex: string }> = {
  violet: { bg: 'bg-violet-600', border: 'border-violet-400', text: 'text-violet-600', light: 'bg-violet-50', hex: '#7C3AED' },
  green:  { bg: 'bg-green-600',  border: 'border-green-400',  text: 'text-green-600',  light: 'bg-green-50',  hex: '#16A34A' },
  blue:   { bg: 'bg-blue-600',   border: 'border-blue-400',   text: 'text-blue-600',   light: 'bg-blue-50',   hex: '#2563EB' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-500', light: 'bg-orange-50', hex: '#F97316' },
}

export interface PersonalProfile {
  gender: 'male' | 'female'
  age: number
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
  childrenCount: number
  isSingleParent: boolean
  creditPointsOverride: number | null // null = auto-calculate
}

export interface JobOffer {
  id: string
  name: string
  color: OfferColor

  // 💰 שכר בסיס
  grossSalary: number

  // 🎁 בונוס
  annualBonusPct: number       // % מהשכר השנתי
  annualBonusFixed: number     // סכום קבוע שנתי
  signOnBonus: number          // חד פעמי (לא נכנס לחישוב שוטף)

  // 📈 הון ומניות
  rsuAnnualValue: number       // שווי RSU שנתי (ממוצע vesting)
  rsuTaxType: 'section102' | 'income'   // 102 = 25%, income = שיעור שולי
  optionsAnnualValue: number   // שווי אופציות שנתי משוער

  // 🏦 פנסיה וחיסכון
  pensionEmployerRate: number  // ברירת מחדל 6.5%
  pensionEmployeeRate: number  // ברירת מחדל 6%
  hasStudyFund: boolean
  studyFundEmployerRate: number // ברירת מחדל 7.5%
  studyFundEmployeeRate: number // ברירת מחדל 2.5%

  // 🍔 אוכל
  cibusPerDay: number          // ₪ ליום (פטור עד ₪128/יום)
  workDaysPerMonth: number     // ברירת מחדל 22
  officeMeals: boolean         // ארוחות חינם במשרד (ערך משוער ₪50/ארוחה)
  officeMealsPerDay: number    // כמה ארוחות ביום (ברירת מחדל 1)

  // 🚗 תחבורה
  carImputed: number           // שווי שימוש ברכב חברה — נוסף להכנסה חייבת!
  carAllowance: number         // קו כסף — מזומן חייב במס
  transportationMonthly: number // החזר נסיעות (פטור עד תקרה)
  parkingMonthly: number       // חנייה (ערך כסף)

  // 🏥 ביטוחים ובריאות
  healthInsuranceMonthly: number // ביטוח בריאות פרטי (מדיקל, שיניים, ראייה)
  lifeInsuranceMonthly: number   // ביטוח חיים מעבר לפנסיה

  // 🧘 רווחה והטבות
  welfareAnnualBudget: number  // תקציב רווחה (ספורט, תרבות, נופש)
  vacationDays: number         // ימי חופש (ברירת מחדל 12)
  gymMonthly: number           // מנוי ספורט / חדר כושר
  trainingAnnual: number       // תקציב הכשרות / קורסים / כנסים
  equipmentAnnual: number      // ציוד (מחשב, מסך, כסא וכו')
  phoneMonthly: number         // טלפון (מכשיר + חבילה)
  childcareMonthly: number     // סיוע בגן ילדים

  // 🏠 גמישות (ערך איכותי)
  wfhDaysPerWeek: number       // 0-5
  flexibleHours: boolean
}

export const DEFAULT_OFFER: Omit<JobOffer, 'id' | 'name' | 'color'> = {
  grossSalary: 20000,
  annualBonusPct: 0,
  annualBonusFixed: 0,
  signOnBonus: 0,
  rsuAnnualValue: 0,
  rsuTaxType: 'section102',
  optionsAnnualValue: 0,
  pensionEmployerRate: 6.5,
  pensionEmployeeRate: 6,
  hasStudyFund: true,
  studyFundEmployerRate: 7.5,
  studyFundEmployeeRate: 2.5,
  cibusPerDay: 0,
  workDaysPerMonth: 22,
  officeMeals: false,
  officeMealsPerDay: 1,
  carImputed: 0,
  carAllowance: 0,
  transportationMonthly: 0,
  parkingMonthly: 0,
  healthInsuranceMonthly: 0,
  lifeInsuranceMonthly: 0,
  welfareAnnualBudget: 0,
  vacationDays: 12,
  gymMonthly: 0,
  trainingAnnual: 0,
  equipmentAnnual: 0,
  phoneMonthly: 0,
  childcareMonthly: 0,
  wfhDaysPerWeek: 0,
  flexibleHours: false,
}

export const DEFAULT_PROFILE: PersonalProfile = {
  gender: 'male',
  age: 30,
  maritalStatus: 'single',
  childrenCount: 0,
  isSingleParent: false,
  creditPointsOverride: null,
}

export interface OfferResult {
  offerId: string

  // שכר
  taxableMonthly: number          // הכנסה חייבת חודשית (כולל רכב, קו כסף, עודף סיבוס)
  netSalaryMonthly: number        // נטו מזומן חודשי
  netSalaryAnnual: number         // נטו מזומן שנתי
  effectiveTaxRate: number        // % מס אפקטיבי
  marginalTaxRate: number         // % שיעור שולי (לחישוב בונוס ו-RSU)

  // בונוס
  annualBonusGross: number        // בונוס ברוטו שנתי
  annualBonusNet: number          // בונוס נטו שנתי (אחרי מס שולי)

  // הון
  annualEquityGross: number       // RSU + אופציות שנתי
  annualEquityNet: number         // אחרי מס

  // הטבות פטורות ממס (ערך שנתי)
  taxFreePerks: {
    cibus: number
    officeMeals: number
    healthInsurance: number
    lifeInsurance: number
    welfare: number
    gym: number
    training: number
    equipment: number
    phone: number
    parking: number
    transportation: number
    childcare: number
    extraVacation: number         // ערך ימי חופש מעל 12 (יום עבודה ממוצע)
  }
  taxFreePerksTotal: number

  // חיסכון נצבר (שנתי — לא מזומן אבל שלך)
  annualPensionAccrual: number    // עובד + מעסיק + פיצויים
  annualStudyFundAccrual: number  // עובד + מעסיק

  // סיכומים
  totalLiquidAnnual: number       // נטו שכר + בונוס + אקוויטי + הטבות
  totalWithSavingsAnnual: number  // + פנסיה + השתלמות
  signOnBonus: number
}

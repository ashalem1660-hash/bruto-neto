'use client'

import { useState, useEffect, useCallback } from 'react'
import { calculate } from '@/lib/tax-calculator'
import { useDebounce } from './useDebounce'
import type { CalculatorInput, CalculatorResult, TaxParameters } from '@/lib/types'

const DEFAULT_INPUT: CalculatorInput = {
  employeeType: 'employee',
  gender: 'male',
  grossIncome: 15000,
  age: 35,
  maritalStatus: 'single',
  isNewImmigrant: false,
  isReturningResident: false,
  children: [],
  disability: { hasDisability: false, percentage: 0, isBlind: false },
  settlement: { isRecognized: false, category: null, name: '' },
  // פנסיה + השתלמות
  pensionRate: 6,
  hasStudyFund: false,
  studyFundEmployerRate: 7.5,
  studyFundEmployeeRate: 2.5,
  existingPensionBalance: 0,
  retirementAge: 67,
  pensionReturnRate: 4,
  studyFund: 0,
  // שכיר כללי
  hasTravelAllowance: false,
  travelAllowance: 0,
  isSingleParent: false,
  paysMaintenance: false,
  spouseNotWorking: false,
  isVeteran: false,
  hasBachelors: false,
  bachelorGraduationYear: 2024,
  hasMasters: false,
  masterGraduationYear: 2022,
  // עצמאי
  annualRevenue: 300000,
  annualExpenses: 60000,
  isVatExempt: false,
  vatObligated: true,
  pensionSelfRate: 6,
  studyFundSelf: 0,
  hasStudyFundSelf: false,
  disabilityInsuranceCost: 0
}

export function useCalculator(params: TaxParameters) {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT)
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [compareInput, setCompareInput] = useState<CalculatorInput | null>(null)
  const [compareResult, setCompareResult] = useState<CalculatorResult | null>(null)

  const debouncedInput = useDebounce(input, 300)
  const debouncedCompare = useDebounce(compareInput, 300)

  useEffect(() => {
    try {
      const r = calculate(debouncedInput, params)
      setResult(r)
    } catch {
      // ignore
    }
  }, [debouncedInput, params])

  useEffect(() => {
    if (!debouncedCompare) { setCompareResult(null); return }
    try {
      setCompareResult(calculate(debouncedCompare, params))
    } catch {
      setCompareResult(null)
    }
  }, [debouncedCompare, params])

  const updateInput = useCallback((updates: Partial<CalculatorInput>) => {
    setInput(prev => ({ ...prev, ...updates }))
  }, [])

  const enableCompare = useCallback(() => setCompareInput({ ...input }), [input])
  const disableCompare = useCallback(() => { setCompareInput(null); setCompareResult(null) }, [])
  const updateCompare = useCallback((updates: Partial<CalculatorInput>) => {
    setCompareInput(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return { input, result, compareInput, compareResult, updateInput, enableCompare, disableCompare, updateCompare }
}

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
  pensionRate: 6,
  hasStudyFund: false,
  studyFundEmployerRate: 7.5,
  studyFundEmployeeRate: 2.5,
  existingPensionBalance: 0,
  retirementAge: 67,
  pensionReturnRate: 4,
  studyFund: 0,
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
  annualRevenue: 300000,
  annualExpenses: 60000,
  isVatExempt: false,
  vatObligated: true,
  pensionSelfRate: 6,
  studyFundSelf: 0,
  hasStudyFundSelf: false,
  disabilityInsuranceCost: 0
}

const LS_KEY = 'bruto-neto-input-v1'

function loadFromStorage(): CalculatorInput {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_INPUT
    return { ...DEFAULT_INPUT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_INPUT
  }
}

function saveToStorage(input: CalculatorInput) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(input))
  } catch {}
}

export function useCalculator(params: TaxParameters) {
  const [input, setInput] = useState<CalculatorInput>(DEFAULT_INPUT)
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after hydration
  useEffect(() => {
    setInput(loadFromStorage())
    setHydrated(true)
  }, [])

  const debouncedInput = useDebounce(input, 300)

  useEffect(() => {
    if (!hydrated) return
    try {
      const r = calculate(debouncedInput, params)
      setResult(r)
      saveToStorage(debouncedInput)
    } catch {}
  }, [debouncedInput, params, hydrated])

  const updateInput = useCallback((updates: Partial<CalculatorInput>) => {
    setInput(prev => ({ ...prev, ...updates }))
  }, [])

  return { input, result, updateInput }
}

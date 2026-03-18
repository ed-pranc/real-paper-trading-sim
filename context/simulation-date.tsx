'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'rpt_simulation_date'

interface SimulationDateContextValue {
  simulationDate: string | null   // ISO date string, null = live mode
  setSimulationDate: (date: string | null) => void
  isLive: boolean
}

const SimulationDateContext = createContext<SimulationDateContextValue | null>(null)

/**
 * Provides global simulation date state to the app.
 * When simulationDate is null, the app uses live prices.
 * State is persisted to localStorage so the sim session survives page reloads.
 * Starts as null on the server (SSR-safe) and hydrates from storage on mount.
 * @param {{ children: React.ReactNode }} props
 */
export function SimulationDateProvider({ children }: { children: React.ReactNode }) {
  // Always start null to match SSR render — hydrated from localStorage after mount
  const [simulationDate, setSimulationDateState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setSimulationDateState(stored)
  }, [])

  const setSimulationDate = useCallback((date: string | null) => {
    setSimulationDateState(date)
    if (date === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, date)
    }
  }, [])

  return (
    <SimulationDateContext.Provider
      value={{
        simulationDate,
        setSimulationDate,
        isLive: simulationDate === null,
      }}
    >
      {children}
    </SimulationDateContext.Provider>
  )
}

/**
 * Returns the current simulation date context.
 * Must be used inside SimulationDateProvider.
 * @returns {{ simulationDate: string | null; setSimulationDate: (date: string | null) => void; isLive: boolean }}
 */
export function useSimulationDate() {
  const ctx = useContext(SimulationDateContext)
  if (!ctx) throw new Error('useSimulationDate must be used inside SimulationDateProvider')
  return ctx
}

/**
 * Returns the active date string for API calls: simulation date if set, otherwise today.
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function useActiveDate() {
  const { simulationDate } = useSimulationDate()
  if (simulationDate) return simulationDate
  return new Date().toISOString().split('T')[0]
}

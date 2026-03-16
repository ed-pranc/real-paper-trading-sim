'use client'

import { createContext, useContext, useState } from 'react'

interface SimulationDateContextValue {
  simulationDate: string | null   // ISO date string, null = live mode
  setSimulationDate: (date: string | null) => void
  isLive: boolean
}

const SimulationDateContext = createContext<SimulationDateContextValue | null>(null)

export function SimulationDateProvider({ children }: { children: React.ReactNode }) {
  const [simulationDate, setSimulationDate] = useState<string | null>(null)

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

export function useSimulationDate() {
  const ctx = useContext(SimulationDateContext)
  if (!ctx) throw new Error('useSimulationDate must be used inside SimulationDateProvider')
  return ctx
}

/** Returns the active date string for API calls: simulation date or today */
export function useActiveDate() {
  const { simulationDate } = useSimulationDate()
  if (simulationDate) return simulationDate
  return new Date().toISOString().split('T')[0]
}

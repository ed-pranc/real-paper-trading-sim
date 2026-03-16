'use client'

import { useSimulationDate } from '@/context/simulation-date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarClock } from 'lucide-react'

export function SimulationDateSelector() {
  const { simulationDate, setSimulationDate, isLive } = useSimulationDate()

  return (
    <div className="flex items-center gap-2">
      <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
      {isLive ? (
        <Badge variant="default" className="bg-green-600 text-white">LIVE</Badge>
      ) : (
        <Badge variant="secondary">SIM: {simulationDate}</Badge>
      )}
      <Input
        type="date"
        max={new Date().toISOString().split('T')[0]}
        value={simulationDate ?? ''}
        onChange={(e) => setSimulationDate(e.target.value || null)}
        className="h-7 w-36 text-xs"
      />
      {!isLive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setSimulationDate(null)}
        >
          Go Live
        </Button>
      )}
    </div>
  )
}

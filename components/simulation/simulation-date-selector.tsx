'use client'

import { useState } from 'react'
import { useSimulationDate } from '@/context/simulation-date'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarClock } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const today = new Date()
today.setHours(0, 0, 0, 0)

export function SimulationDateSelector() {
  const { simulationDate, setSimulationDate, isLive } = useSimulationDate()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (!simulationDate) setSimulationDate(today.toISOString().split('T')[0])
      setPopoverOpen(true)
    } else {
      setSimulationDate(null)
      setPopoverOpen(false)
    }
  }

  const selectedDate = simulationDate ? parseISO(simulationDate) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    setSimulationDate(date.toISOString().split('T')[0])
    setPopoverOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
      <Badge className={isLive ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}>LIVE</Badge>
      <Switch checked={!isLive} onCheckedChange={handleToggle} />
      <Badge className={!isLive ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}>SIMULATION</Badge>
      {!isLive && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="h-7 px-2 rounded-md border border-input bg-background text-xs font-medium hover:bg-accent transition-colors">
              {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : 'Pick date'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={{ after: today }}
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={today}
              defaultMonth={selectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

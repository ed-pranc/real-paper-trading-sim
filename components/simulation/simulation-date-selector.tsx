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
      if (!simulationDate) setSimulationDate(format(today, 'yyyy-MM-dd'))
      setPopoverOpen(true)
    } else {
      setSimulationDate(null)
      setPopoverOpen(false)
    }
  }

  const selectedDate = simulationDate ? parseISO(simulationDate) : undefined

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    setSimulationDate(format(date, 'yyyy-MM-dd'))
    setPopoverOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
      <Badge onClick={() => handleToggle(false)} className={`cursor-pointer ${isLive ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>LIVE</Badge>
      <Switch checked={!isLive} onCheckedChange={handleToggle} />
      <Badge onClick={() => handleToggle(true)} className={`cursor-pointer ${!isLive ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>SIMULATION</Badge>
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

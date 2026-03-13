'use client'

import { useBoardContext } from '@/lib/board-store'
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns'
import { KanbanCard } from './kanban-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Card } from '@/lib/types'

interface PlannerViewProps {
  onCardClick: (card: Card) => void
}

export function PlannerView({ onCardClick }: PlannerViewProps) {
  const { state } = useBoardContext()
  
  // Get the start of the current week (Monday)
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }) 
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))

  // Get all cards that have a due date and are not archived
  const cardsWithDates = Object.values(state.cards).filter(c => c.dueDate && !c.archived)

  return (
    <div className="flex-1 w-full h-[calc(100vh-140px)] flex flex-col max-w-[1400px] mx-auto px-4 md:px-6 pb-24 md:pb-12">
      
      {/* MINIMAL HEADER */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-end justify-between px-2 gap-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Planner
          </h2>
          <p className="text-white/60 mt-1 font-medium text-xs md:text-sm">
            {format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d, yyyy')}
          </p>
        </div>
        
        {/* Mobile Swipe Hint */}
        <div className="md:hidden text-[10px] text-white/40 font-medium uppercase tracking-widest flex items-center gap-1.5 mt-2">
          <span>← Swipe to see more →</span>
        </div>
      </div>

      {/* UNIFIED GLASS PANEL */}
      <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* 🔥 FIXED: Bulletproof Flex Layout for both Mobile and Desktop */}
        <div className="flex w-full h-full divide-x divide-white/10 overflow-x-auto md:overflow-x-hidden snap-x snap-mandatory md:snap-none scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {weekDays.map(day => {
            const dayCards = cardsWithDates.filter(c => isSameDay(new Date(c.dueDate!), day))
            const isCurrentDay = isToday(day)

            return (
              <div 
                key={day.toISOString()} 
                // 🔥 FIXED: w-[85vw] on mobile, exact equal parts (flex-1) on desktop
                className={`flex flex-col h-full transition-colors shrink-0 snap-center w-[85vw] sm:w-[320px] md:w-auto md:flex-1 ${
                  isCurrentDay ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* ELEGANT DAY HEADER */}
                <div className="p-4 md:p-5 flex flex-col items-center justify-center border-b border-white/10">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 ${
                    isCurrentDay ? 'text-primary' : 'text-white/40'
                  }`}>
                    {format(day, 'EEE')}
                  </span>
                  <div className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-base md:text-lg font-medium ${
                    isCurrentDay ? 'bg-primary text-primary-foreground shadow-md' : 'text-white/90'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
                
                {/* CARDS AREA */}
                <ScrollArea className="flex-1">
                  <div className="p-3 md:p-4 space-y-3">
                    {dayCards.map(card => (
                      <div key={card.id} className="drop-shadow-sm hover:drop-shadow-md transition-all">
                        <KanbanCard card={card} onClick={() => onCardClick(card)} />
                      </div>
                    ))}
                    
                    {/* SUBTLE EMPTY STATE */}
                    {dayCards.length === 0 && (
                      <div className="pt-8 flex justify-center">
                        <span className="text-xs font-medium text-white/20 tracking-wide">
                          No tasks
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
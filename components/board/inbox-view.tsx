'use client'

import { useBoardContext } from '@/lib/board-store'
import { format, isPast, isToday } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import type { Card } from '@/lib/types'

interface InboxViewProps {
  onCardClick: (card: Card) => void
}

export function InboxView({ onCardClick }: InboxViewProps) {
  const { state } = useBoardContext()

  const allCards = Object.values(state.cards).filter(c => !c.archived)

  const overdue = allCards.filter(c => c.dueDate && isPast(new Date(c.dueDate)) && !isToday(new Date(c.dueDate)))
  const dueToday = allCards.filter(c => c.dueDate && isToday(new Date(c.dueDate)))
  const upcoming = allCards.filter(c => c.dueDate && !isPast(new Date(c.dueDate)) && !isToday(new Date(c.dueDate)))
  const noDate = allCards.filter(c => !c.dueDate).slice(0, 15)

  // Minimal Row Component
  const renderCardRow = (card: Card, alertType: 'danger' | 'warning' | 'normal', isLast: boolean) => {
    const list = state.lists[card.listId]
    
    let dateColor = 'text-white/40'
    let dotColor = 'bg-white/40'

    if (alertType === 'danger') {
      dateColor = 'text-red-400'
      dotColor = 'bg-red-500'
    } else if (alertType === 'warning') {
      dateColor = 'text-amber-400'
      dotColor = 'bg-amber-500'
    }

    return (
      <div 
        key={card.id}
        onClick={() => onCardClick(card)}
        className={`group flex items-center justify-between p-4 sm:px-6 cursor-pointer transition-colors hover:bg-white/[0.04] ${!isLast ? 'border-b border-white/5' : ''}`}
      >
        <div className="flex items-center gap-4">
          {/* Minimal Circle Checkbox Indicator */}
          <div className={`w-4 h-4 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-all`}>
            <div className={`w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${dotColor}`} />
          </div>
          
          <div className="flex flex-col">
            <span className="text-white/90 font-medium text-sm tracking-wide group-hover:text-white transition-colors">
              {card.title}
            </span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
              {list?.title || 'Unknown List'}
            </span>
          </div>
        </div>
        
        {card.dueDate && (
          <div className={`text-xs font-medium flex items-center gap-1.5 ${dateColor}`}>
            <CalendarDays className="w-3.5 h-3.5 opacity-70" />
            {format(new Date(card.dueDate), 'MMM d')}
          </div>
        )}
      </div>
    )
  }

  // Unified Glass Panel for Sections
  const renderSection = (title: string, cards: Card[], type: 'danger' | 'warning' | 'normal') => {
    if (cards.length === 0) return null

    let titleColor = 'text-white/40'
    if (type === 'danger') titleColor = 'text-red-400'
    if (type === 'warning') titleColor = 'text-amber-400'

    return (
      <div className="mb-8">
        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] px-6 mb-3 ${titleColor}`}>
          {title}
        </h3>
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {cards.map((c, i) => renderCardRow(c, type, i === cards.length - 1))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full h-[calc(100vh-140px)] flex flex-col max-w-[900px] mx-auto px-6 pb-24">
      
      {/* HEADER */}
      <div className="mb-8 flex items-end justify-between px-2 mt-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Inbox
          </h2>
          <p className="text-white/50 mt-1 font-medium text-sm">
            Your tasks across all boards
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="pb-10">
          
          {renderSection('Overdue', overdue, 'danger')}
          {renderSection('Due Today', dueToday, 'warning')}
          {renderSection('Upcoming', upcoming, 'normal')}
          {renderSection('No Due Date', noDate, 'normal')}

          {/* EMPTY STATE */}
          {allCards.length === 0 && (
            <div className="mt-32 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-lg font-medium text-white/80 tracking-tight">You're all caught up</h3>
              <p className="text-sm text-white/40 mt-1">No active tasks in your inbox.</p>
            </div>
          )}

        </div>
      </ScrollArea>
    </div>
  )
}
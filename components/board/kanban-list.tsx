'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, X, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBoardContext } from '@/lib/board-store'
import { KanbanCard } from './kanban-card'
import type { List, Card } from '@/lib/types'
import { updateListColor, createCard, deleteList } from '@/actions/board'

interface KanbanListProps {
  list: List
  cards: Card[]
  onCardClick: (card: Card) => void
}

// 🔥 Naya Updated Colors & Gradients Array
const LIST_COLORS = [
  null, // Default Glass
  '#f87171', // Red
  '#60a5fa', // Blue
  '#34d399', // Green
  '#a78bfa', // Purple
  '#fbbf24', // Amber
  'linear-gradient(to bottom right, #6366f1, #a855f7)', // Indigo-Purple
  'linear-gradient(to bottom right, #f43f5e, #fb923c)', // Rose-Orange
  'linear-gradient(to bottom right, #0ea5e9, #22d3ee)', // Sky-Cyan
  'linear-gradient(to bottom right, #111827, #374151)', // Dark Slate
  'linear-gradient(to bottom right, #84cc16, #10b981)', // Lime-Emerald
  'linear-gradient(to bottom right, #ec4899, #f43f5e)', // Pink-Rose
]

export function KanbanList({ list, cards, onCardClick }: KanbanListProps) {
  const { dispatch } = useBoardContext()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLTextAreaElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })

  // 🔥 Style logic optimized for Gradients and Mobile Drag
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    background: list.color?.includes('gradient') 
      ? list.color 
      : list.color 
        ? `${list.color}80` // Solid colors with 50% opacity for glass effect
        : undefined,
  }

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isAddingCard && cardInputRef.current) cardInputRef.current.focus()
  }, [isAddingCard])

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      dispatch({ type: 'UPDATE_LIST_TITLE', payload: { listId: list.id, title: editTitle.trim() } })
    } else {
      setEditTitle(list.title)
    }
    setIsEditingTitle(false)
  }

  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      const title = newCardTitle.trim()
      const listId = list.id
      const position = cards.length

      dispatch({ type: 'ADD_CARD', payload: { listId, title } })
      await createCard(listId, title, position)
      setNewCardTitle('')
    }
    setIsAddingCard(false)
  }

  const handleDeleteList = async () => {
    if (window.confirm("Are you sure you want to delete this list?")) {
      dispatch({ type: 'DELETE_LIST', payload: list.id })
      await deleteList(list.id)
    }
  }

  const handleColorChange = async (color: string | null) => {
    dispatch({ type: 'UPDATE_LIST_COLOR', payload: { listId: list.id, color } })
    await updateListColor(list.id, color)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-[320px] rounded-2xl flex flex-col max-h-[calc(100vh-180px)] border transition-all duration-300 ${
        !list.color ? 'bg-background/40 border-white/20 backdrop-blur-xl' : 'backdrop-blur-xl border-white/20 shadow-xl'
      } ${isDragging ? 'opacity-60 shadow-2xl scale-[1.02] border-primary/50 z-50' : 'shadow-lg'}`}
    >
      {/* List Header */}
      <div className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0" {...attributes} {...listeners}>
        <div className="flex items-center gap-2">
           {list.color && (
             <div 
               className="h-3 w-3 rounded-full border border-white/20 shadow-sm" 
               style={{ background: list.color.includes('gradient') ? list.color : list.color }} 
             />
           )}
           {isEditingTitle ? (
             <Input ref={titleInputRef} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleSaveTitle} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setEditTitle(list.title); setIsEditingTitle(false) } }} className="h-8 font-bold text-base bg-background/50 border-white/20" />
           ) : (
             <button onClick={() => setIsEditingTitle(true)} className="font-bold text-base text-white hover:text-primary px-1 -ml-1 rounded transition-colors drop-shadow-sm truncate max-w-[180px]">
               {list.title}
             </button>
           )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-white/70 px-2 py-1 rounded-md bg-black/20 shadow-inner">
            {cards.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-white rounded-lg"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-xl z-[100]">
              <div className="px-3 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">Appearance</div>
              <div className="grid grid-cols-4 gap-2 p-3">
                {LIST_COLORS.map((color, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleColorChange(color)} 
                    className={`w-10 h-8 rounded-md border-2 border-white/10 shadow-sm hover:scale-110 transition-transform ${list.color === color ? 'ring-2 ring-primary ring-offset-1' : ''}`} 
                    style={{ background: color || 'rgba(255,255,255,0.1)' }} 
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsAddingCard(true)} className="py-2 cursor-pointer font-medium">Add card</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)} className="py-2 cursor-pointer font-medium">Edit list title</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteList} className="text-destructive py-2 cursor-pointer font-medium">
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 custom-scrollbar">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-4">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Footer / Add Card */}
      <div className="p-3 pt-2 shrink-0 border-t border-white/5">
        {isAddingCard ? (
          <div className="bg-background/80 rounded-xl p-3 shadow-sm border border-border space-y-3">
            <Textarea ref={cardInputRef} value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} placeholder="What needs to be done?" className="min-h-[70px] resize-none text-sm border-none shadow-none focus-visible:ring-0 px-1" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() } if (e.key === 'Escape') { setNewCardTitle(''); setIsAddingCard(false) } }} />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAddCard} className="w-full">Add card</Button>
              <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => { setNewCardTitle(''); setIsAddingCard(false) }}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 font-medium" onClick={() => setIsAddingCard(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add a card
          </Button>
        )}
      </div>
    </div>
  )
}
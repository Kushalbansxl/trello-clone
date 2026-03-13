'use client'
import { updateListColor, createCard, deleteList } from '@/actions/board' // 🔥 deleteList add karo
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



interface KanbanListProps {
  list: List
  cards: Card[]
  onCardClick: (card: Card) => void
}

export function KanbanList({ list, cards, onCardClick }: KanbanListProps) {
  const { dispatch } = useBoardContext()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLTextAreaElement>(null)

  const listColors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', null]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id })

  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    // baaki agar color wagarah hai toh waise hi rehne dena
    backgroundColor: list.color ? `${list.color}15` : undefined,
    borderColor: list.color ? `${list.color}30` : undefined,
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
    // 1. Instant UI se gayab karo
    dispatch({ type: 'DELETE_LIST', payload: list.id })
    // 2. Database se permanently uda do
    await deleteList(list.id)
  }

  const handleColorChange = async (color: string | null) => {
    dispatch({ type: 'UPDATE_LIST_COLOR', payload: { listId: list.id, color } })
    await updateListColor(list.id, color)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: list.color ? `${list.color}80` : undefined,
        borderColor: list.color ? `${list.color}30` : undefined,
      }}
      className={`flex-shrink-0 w-[320px] rounded-2xl flex flex-col max-h-[calc(100vh-180px)] border ${
        !list.color ? 'bg-background/40 border-white/20 backdrop-blur-xl' : 'backdrop-blur-xl'
      } ${isDragging ? 'opacity-60 shadow-2xl scale-[1.02] border-primary/50 z-50' : 'shadow-lg'}`}
    >
      <div className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0" {...attributes} {...listeners}>
        <div className="flex items-center gap-2">
           {list.color && <Circle className="h-3 w-3 fill-current" style={{ color: list.color }} />}
           {isEditingTitle ? (
             <Input ref={titleInputRef} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleSaveTitle} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') { setEditTitle(list.title); setIsEditingTitle(false) } }} className="h-8 font-bold text-base bg-background/50 border-white/20" />
           ) : (
             <button onClick={() => setIsEditingTitle(true)} className="font-bold text-base text-foreground hover:text-primary px-1 -ml-1 rounded transition-colors drop-shadow-sm">
               {list.title}
             </button>
           )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground px-2 py-1 rounded-md bg-background/50 shadow-inner">
            {cards.length}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/50 rounded-lg"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
              <div className="px-3 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">List Color</div>
              <div className="flex flex-wrap gap-2 p-3">
                {listColors.map((color, i) => (
                  <button key={i} onClick={() => handleColorChange(color)} className="w-8 h-8 rounded-full border-2 border-white/10 shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: color || 'var(--muted)' }} />
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

      {/* 🔥 THE FIX: min-h-0 and native overflow-y-auto 🔥 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 custom-scrollbar">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-4">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}
          </div>
        </SortableContext>
      </div>

      <div className="p-3 pt-2 shrink-0 border-t border-border/10">
        {isAddingCard ? (
          <div className="bg-background/80 rounded-xl p-3 shadow-sm border border-border space-y-3">
            <Textarea ref={cardInputRef} value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} placeholder="What needs to be done?" className="min-h-[70px] resize-none text-sm border-none shadow-none focus-visible:ring-0 px-1" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() } if (e.key === 'Escape') { setNewCardTitle(''); setIsAddingCard(false) } }} />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAddCard} className="w-full">Add card</Button>
              <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => { setNewCardTitle(''); setIsAddingCard(false) }}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-background/60 rounded-xl h-10 font-medium" onClick={() => setIsAddingCard(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add a card
          </Button>
        )}
      </div>
    </div>
  )
}
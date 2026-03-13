'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus, X, Loader2, LayoutDashboard, Inbox, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useBoardContext } from '@/lib/board-store'
import { KanbanList } from './kanban-list'
import { KanbanCard } from './kanban-card'
import { CardDetailModal } from './card-detail-modal'
import type { Card, List } from '@/lib/types'
import { isPast, isToday, isThisWeek, parseISO } from 'date-fns'
import { getBoards, createList, updateCardOrder, updateListOrder } from '@/actions/board'

export function KanbanBoard() {
  const { state, dispatch } = useBoardContext()
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeList, setActiveList] = useState<List | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBoardData() {
      try {
        const data = await getBoards()
        if (data && data.length > 0) {
          
          // 1. Check URL for a specific board ID, otherwise fallback to the first board
          const params = new URLSearchParams(window.location.search)
          const requestedId = params.get('boardId')
          let activeApiBoard = data.find((b: any) => b.id === requestedId)

          if (!activeApiBoard) {
            activeApiBoard = data[0] // Fallback if ID doesn't exist
          }

          // 2. Generate list of all boards for the Dropdown menu
          const availableBoards = data.map((b: any) => ({ id: b.id, title: b.title }))

          // 3. Extract Board-level Labels and Members
          const boardLabels = activeApiBoard.labels || []
          const boardMembers = activeApiBoard.members || []

          const normalizedLists: Record<string, List> = {}
          const normalizedCards: Record<string, Card> = {}
          const listIds: string[] = []

          const sortedLists = [...(activeApiBoard.lists || [])].sort((a, b) => a.order - b.order)

          sortedLists.forEach((list: any) => {
            listIds.push(list.id)
            const cardIds: string[] = []
            const sortedCards = [...(list.cards || [])].sort((a, b) => a.order - b.order)

            sortedCards.forEach((card: any) => {
              cardIds.push(card.id)
              normalizedCards[card.id] = { 
                ...card, 
                position: card.order,
                // Extract just the IDs for the state array
                labels: card.labels?.map((l: any) => l.id) || [], 
                members: card.members?.map((m: any) => m.id) || [], 
                // Map the Prisma checklist schema to your UI schema
                checklists: card.checklists?.map((cl: any) => ({
                   id: cl.id,
                   title: cl.title,
                   items: cl.items?.map((i: any) => ({ 
                     id: i.id, 
                     text: i.text, 
                     completed: i.isCompleted 
                   })) || []
                })) || [], 
                comments: card.comments || [], 
                attachments: card.attachments || [],
                description: card.description || null,
                coverImage: card.coverImage || null,
                dueDate: card.dueDate ? new Date(card.dueDate) : null,
                archived: card.archived || false,
                createdAt: new Date(card.createdAt)
              }
            })
            
            normalizedLists[list.id] = { 
              ...list, 
              position: list.order, 
              color: list.color || null,
              cards: cardIds 
            }
          })

          dispatch({
            type: 'SET_INITIAL_DATA',
            payload: {
              board: { 
                id: activeApiBoard.id, 
                title: activeApiBoard.title, 
                lists: listIds, 
                background: activeApiBoard.background || 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' 
              },
              lists: normalizedLists,
              cards: normalizedCards,
              labels: boardLabels,    // Inject real labels
              members: boardMembers,  // Inject real members
              availableBoards         // Inject available boards into global context
            }
          })
        }
      } catch (err) {
        console.error("Failed to load board data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadBoardData()
  }, [dispatch])

const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Mouse ko kam se kam 5px hilna padega drag start hone ke liye
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Mobile par 200ms tak daba ke rakhna padega drag ke liye
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const findContainer = (id: string) => {
    if (state.lists[id]) return id
    return Object.values(state.lists).find((list) => list.cards.includes(id))?.id
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string
    if (state.cards[activeId]) {
      setActiveCard(state.cards[activeId])
    } else if (state.lists[activeId]) {
      setActiveList(state.lists[activeId])
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    if (state.cards[activeId]) {
      const overList = state.lists[overContainer]
      if (!overList) return

      const overIndex = overList.cards.indexOf(overId)
      const newIndex = overIndex >= 0 ? overIndex : overList.cards.length

      dispatch({
        type: 'MOVE_CARD',
        payload: { cardId: activeId, fromListId: activeContainer, toListId: overContainer, newIndex },
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (state.lists[activeId] && state.lists[overId]) {
      const oldIndex = state.board.lists.indexOf(activeId)
      const newIndex = state.board.lists.indexOf(overId)

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(state.board.lists, oldIndex, newIndex)
        dispatch({ type: 'REORDER_LISTS', payload: newOrder })
        await updateListOrder(newOrder.map((id, index) => ({ id, order: index })))
      }
      return
    }

    if (state.cards[activeId]) {
      const activeContainer = findContainer(activeId)
      const overContainer = findContainer(overId)

      if (!activeContainer || !overContainer) return

      if (activeContainer === overContainer) {
        const list = state.lists[activeContainer]
        const oldIndex = list.cards.indexOf(activeId)
        const newIndex = list.cards.indexOf(overId)

        let finalOrder = list.cards;
        if (oldIndex !== newIndex && newIndex >= 0) {
          finalOrder = arrayMove(list.cards, oldIndex, newIndex)
          dispatch({ type: 'REORDER_CARDS', payload: { listId: activeContainer, cardIds: finalOrder } })
        }
        await updateCardOrder(finalOrder.map((id, index) => ({ id, order: index, listId: activeContainer })))
      } else {
         const overList = state.lists[overContainer]
         const finalOrder = [...overList.cards, activeId]
         dispatch({
           type: 'MOVE_CARD',
           payload: { cardId: activeId, fromListId: activeContainer, toListId: overContainer, newIndex: finalOrder.length - 1 }
         })
         await updateCardOrder(finalOrder.map((id, index) => ({ id, order: index, listId: overContainer })))
      }
    }
  }

  const getCardsForList = (listId: string) => {
    const list = state.lists[listId]
    if (!list) return []
    
    // Pehle us list ke saare cards nikaalo
    let filteredCards = list.cards.map((id) => state.cards[id]).filter(Boolean)

    // 1. SEARCH FILTER (Title ya Description mein text match)
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim()
      filteredCards = filteredCards.filter(card => 
        card.title.toLowerCase().includes(query) || 
        (card.description && card.description.toLowerCase().includes(query))
      )
    }

    // 2. LABELS FILTER (Card mein koi ek selected label hona chahiye)
    if (state.filterLabels.length > 0) {
      filteredCards = filteredCards.filter(card => 
        card.labels.some(labelId => state.filterLabels.includes(labelId))
      )
    }

    // 3. MEMBERS FILTER (Card mein koi ek selected member hona chahiye)
    if (state.filterMembers.length > 0) {
      filteredCards = filteredCards.filter(card => 
        card.members.some(memberId => state.filterMembers.includes(memberId))
      )
    }

    // 4. DUE DATE FILTER
    if (state.filterDueDate !== 'all') {
      filteredCards = filteredCards.filter(card => {
        if (!card.dueDate) {
           // Agar user "No due date" maang raha hai, toh jinke paas date nahi hai unko pass karo
           return state.filterDueDate === 'noDueDate'
        }
        
        // Agar date hai, toh check karo
        if (state.filterDueDate === 'noDueDate') return false // Kyunki iske paas toh date hai
        
        const dateObj = new Date(card.dueDate)
        
        if (state.filterDueDate === 'overdue') return isPast(dateObj) && !isToday(dateObj)
        if (state.filterDueDate === 'dueToday') return isToday(dateObj)
        if (state.filterDueDate === 'dueThisWeek') return isThisWeek(dateObj)
        
        return true
      })
    }

    return filteredCards
  }

  const handleAddList = async () => {
    if (newListTitle.trim()) {
      const title = newListTitle.trim()
      const boardId = state.board.id
      const order = state.board.lists.length
      dispatch({ type: 'ADD_LIST', payload: { title } })
      setNewListTitle('')
      setIsAddingList(false)
      await createList(boardId, title, order)
    }
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin text-white/80" /></div>

  return (
    <>
      <div 
        className="flex-1 h-[calc(100vh-56px)] overflow-hidden bg-cover bg-center relative select-none touch-none" 
        style={{ 
          background: state.board?.background,
          WebkitUserSelect: 'none', // Safari fix
          WebkitTouchCallout: 'none' // iOS context menu fix
        }}
      >
        <ScrollArea className="h-full w-full">
          <div className="p-6 min-h-full pb-32">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
              <SortableContext items={state.board?.lists || []} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-6 items-start">
                  {state.board.lists.map((listId) => {
                    const list = state.lists[listId]
                    if (!list) return null
                    return <KanbanList key={list.id} list={list} cards={getCardsForList(list.id)} onCardClick={(c) => setSelectedCard(c)} />
                  })}
                  <div className="flex-shrink-0 w-80">
                    {isAddingList ? (
                      <div className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-4 space-y-3">
                        <Input autoFocus value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} placeholder="Enter list title..." onKeyDown={(e) => e.key === 'Enter' && handleAddList()} className="border-white/20 bg-background/50" />
                        <div className="flex items-center gap-2">
                          <Button onClick={handleAddList} className="w-full shadow-md">Add list</Button>
                          <Button variant="ghost" size="icon" onClick={() => setIsAddingList(false)}><X className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="ghost" className="w-full h-14 justify-start bg-white/10 hover:bg-white/20 text-white border border-dashed border-white/40 rounded-2xl shadow-sm backdrop-blur-sm transition-all" onClick={() => setIsAddingList(true)}>
                        <Plus className="h-5 w-5 mr-2" /> Add another list
                      </Button>
                    )}
                  </div>
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeCard && <div className="rotate-3 scale-105 shadow-2xl opacity-90"><KanbanCard card={activeCard} onClick={() => {}} /></div>}
                {activeList && <div className="w-80 bg-background/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 rotate-2 scale-105 opacity-90"><span className="font-bold text-base">{activeList.title}</span></div>}
              </DragOverlay>
            </DndContext>
          </div>
          <ScrollBar orientation="horizontal" className="bg-black/10 hover:bg-black/20 transition-colors rounded-full mb-2" />
        </ScrollArea>
      </div>

      {/* MAC OS STYLE BOTTOM DOCK */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-2xl border border-border shadow-2xl rounded-[2rem] p-2 flex items-center gap-2 z-50">
        <Button variant="ghost" className="rounded-2xl px-6 py-7 text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex flex-col gap-1.5 h-auto transition-all">
          <Inbox className="h-5 w-5" />
          <span className="text-[11px] font-semibold tracking-wide">Inbox</span>
        </Button>
        <Button variant="secondary" className="rounded-2xl px-6 py-7 bg-primary/15 text-primary hover:bg-primary/25 flex flex-col gap-1.5 h-auto shadow-inner border border-primary/20 transition-all scale-105">
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[11px] font-bold tracking-wide">Board</span>
        </Button>
        <Button variant="ghost" className="rounded-2xl px-6 py-7 text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex flex-col gap-1.5 h-auto transition-all">
          <CalendarIcon className="h-5 w-5" />
          <span className="text-[11px] font-semibold tracking-wide">Planner</span>
        </Button>
      </div>

      {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </>
  )
}
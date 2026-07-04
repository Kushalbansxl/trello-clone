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
import { PlannerView } from './planner-view'
import { InboxView } from './inbox-view'

export function KanbanBoard() {
  const { state, dispatch } = useBoardContext()
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeList, setActiveList] = useState<List | null>(null)
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'inbox' | 'board' | 'planner'>('board')
  const [initialListOrder, setInitialListOrder] = useState<string[]>([])

  useEffect(() => {
    async function loadBoardData() {
      try {
        const data = await getBoards()
        if (data && data.length > 0) {
          const params = new URLSearchParams(window.location.search)
          const requestedId = params.get('boardId')
          let activeApiBoard = data.find((b: any) => b.id === requestedId)

          if (!activeApiBoard) {
            activeApiBoard = data[0]
          }

          const availableBoards = data.map((b: any) => ({ id: b.id, title: b.title }))
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
                labels: card.labels?.map((l: any) => l.id) || [], 
                members: card.members?.map((m: any) => m.id) || [], 
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
              labels: boardLabels,
              members: boardMembers,
              availableBoards
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
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
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
      setInitialListOrder(state.board.lists)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (state.lists[activeId]) {
      let targetListId = overId
      
      if (state.cards[overId]) {
        const foundContainer = findContainer(overId)
        if (foundContainer) targetListId = foundContainer
      }

      if (state.lists[targetListId] && activeId !== targetListId) {
        const oldIndex = state.board.lists.indexOf(activeId)
        const newIndex = state.board.lists.indexOf(targetListId)

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(state.board.lists, oldIndex, newIndex)
          dispatch({ type: 'REORDER_LISTS', payload: newOrder })
        }
      }
      return
    }

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

    if (!over) {
      if (initialListOrder.length > 0) {
        dispatch({ type: 'REORDER_LISTS', payload: initialListOrder })
      }
      setInitialListOrder([])
      return
    }

    const activeId = active.id as string
    const overId = over.id as string
    const isActiveList = !!state.lists[activeId]

    if (isActiveList) {
      const currentOrder = state.board.lists
      if (JSON.stringify(initialListOrder) !== JSON.stringify(currentOrder)) {
        await updateListOrder(currentOrder.map((id, index) => ({ id, order: index })))
      }
      setInitialListOrder([])
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

  const handleDragCancel = () => {
    setActiveCard(null)
    setActiveList(null)
    if (initialListOrder.length > 0) {
      dispatch({ type: 'REORDER_LISTS', payload: initialListOrder })
      setInitialListOrder([])
    }
  }

  const getCardsForList = (listId: string) => {
    const list = state.lists[listId]
    if (!list) return []
    
    let filteredCards = list.cards.map((id) => state.cards[id]).filter(Boolean)

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim()
      filteredCards = filteredCards.filter(card => 
        card.title.toLowerCase().includes(query) || 
        (card.description && card.description.toLowerCase().includes(query))
      )
    }

    if (state.filterLabels.length > 0) {
      filteredCards = filteredCards.filter(card => 
        card.labels.some(labelId => state.filterLabels.includes(labelId))
      )
    }

    if (state.filterMembers.length > 0) {
      filteredCards = filteredCards.filter(card => 
        card.members.some(memberId => state.filterMembers.includes(memberId))
      )
    }

    if (state.filterDueDate !== 'all') {
      filteredCards = filteredCards.filter(card => {
        if (!card.dueDate) {
           return state.filterDueDate === 'noDueDate'
        }
        
        if (state.filterDueDate === 'noDueDate') return false
        
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

  if (isLoading) {
    return (
      <div className="flex-1 h-[calc(100vh-56px)] p-6 flex gap-6 overflow-hidden bg-black/20">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-[320px] rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4 animate-pulse backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 bg-white/20 rounded-md w-1/3"></div>
              <div className="h-6 w-8 bg-white/10 rounded-md"></div>
            </div>
            
            <div className="space-y-3">
              <div className="h-24 bg-white/10 rounded-xl"></div>
              <div className="h-32 bg-white/10 rounded-xl"></div>
              <div className="h-20 bg-white/10 rounded-xl"></div>
            </div>

            <div className="h-10 bg-white/5 rounded-xl w-full mt-4"></div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <>
      <div 
        className="flex-1 h-[calc(100vh-56px)] overflow-hidden bg-cover bg-center relative select-none touch-none" 
        style={{ 
          background: state.board?.background,
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        <ScrollArea className="h-full w-full">
          <div className="p-6 min-h-full pb-32">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCorners} 
              onDragStart={handleDragStart} 
              onDragOver={handleDragOver} 
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              
              {currentView === 'board' ? (
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
              ) : currentView === 'planner' ? (
                <PlannerView onCardClick={(c) => setSelectedCard(c)} />
              ) : (
                <InboxView onCardClick={(c) => setSelectedCard(c)} />
              )}

              <DragOverlay>
                {activeCard && <div className="rotate-3 scale-105 shadow-2xl opacity-90"><KanbanCard card={activeCard} onClick={() => {}} /></div>}
                {activeList && <div className="w-80 bg-background/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 rotate-2 scale-105 opacity-90"><span className="font-bold text-base">{activeList.title}</span></div>}
              </DragOverlay>
            </DndContext>
          </div>
          <ScrollBar orientation="horizontal" className="bg-black/10 hover:bg-black/20 transition-colors rounded-full mb-2" />
        </ScrollArea>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-full p-1.5 flex items-center gap-1 z-50 transition-all">
        
        <button 
          onClick={() => setCurrentView('inbox')}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 ${
            currentView === 'inbox' 
              ? 'bg-white/15 text-white border border-white/5 shadow-sm' 
              : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span className="text-xs md:text-sm font-medium tracking-wide">Inbox</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('board')}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 ${
            currentView === 'board' 
              ? 'bg-white/15 text-white border border-white/5 shadow-sm' 
              : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-xs md:text-sm font-medium tracking-wide">Board</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('planner')}
          className={`flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 ${
            currentView === 'planner' 
              ? 'bg-white/15 text-white border border-white/5 shadow-sm' 
              : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="text-xs md:text-sm font-medium tracking-wide">Planner</span>
        </button>

      </div>

      {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </>
  )
}
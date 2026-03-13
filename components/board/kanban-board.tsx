'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useBoardContext } from '@/lib/board-store'
import { KanbanList } from './kanban-list'
import { KanbanCard } from './kanban-card'
import { CardDetailModal } from './card-detail-modal'
import type { Card, List } from '@/lib/types'
import { isPast, isToday, startOfDay, endOfDay, addDays } from 'date-fns'

// The import line that was causing the error will now work!
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
          const apiBoard = data[0] as any
          const normalizedLists: Record<string, List> = {}
          const normalizedCards: Record<string, Card> = {}
          const listIds: string[] = []

          const sortedLists = [...(apiBoard.lists || [])].sort((a, b) => a.order - b.order)

          sortedLists.forEach((list: any) => {
            listIds.push(list.id)
            const cardIds: string[] = []
            const sortedCards = [...(list.cards || [])].sort((a, b) => a.order - b.order)

            sortedCards.forEach((card: any) => {
              cardIds.push(card.id)
              normalizedCards[card.id] = { 
                ...card, 
                position: card.order,
                labels: card.labels || [], 
                members: card.members || [], 
                checklists: card.checklists || [], 
                comments: card.comments || [], 
                attachments: card.attachments || [],
                description: card.description || "",
                dueDate: card.dueDate ? new Date(card.dueDate) : null,
                archived: card.archived || false,
                createdAt: new Date(card.createdAt)
              }
            })
            
            normalizedLists[list.id] = { ...list, position: list.order, cards: cardIds }
          })

          dispatch({
            type: 'SET_INITIAL_DATA',
            payload: {
              board: { 
                id: apiBoard.id, 
                title: apiBoard.title, 
                lists: listIds, 
                background: apiBoard.background || 'bg-gradient-to-br from-blue-600 to-purple-600' 
              },
              lists: normalizedLists,
              cards: normalizedCards
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

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

    // 1. REORDERING LISTS
    if (state.lists[activeId] && state.lists[overId]) {
      const oldIndex = state.board.lists.indexOf(activeId)
      const newIndex = state.board.lists.indexOf(overId)

      if (oldIndex !== newIndex) {
        const newOrder = arrayMove(state.board.lists, oldIndex, newIndex)
        dispatch({
          type: 'REORDER_LISTS',
          payload: newOrder,
        })
        
        // Save to DB permanently
        const updates = newOrder.map((id, index) => ({ id, order: index }))
        await updateListOrder(updates)
      }
      return
    }

    // 2. REORDERING CARDS
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
          dispatch({
            type: 'REORDER_CARDS',
            payload: { listId: activeContainer, cardIds: finalOrder },
          })
        }

        const updates = finalOrder.map((id, index) => ({ id, order: index, listId: activeContainer }))
        await updateCardOrder(updates)
      } else {
         const overList = state.lists[overContainer]
         const finalOrder = [...overList.cards, activeId]
         
         dispatch({
           type: 'MOVE_CARD',
           payload: { cardId: activeId, fromListId: activeContainer, toListId: overContainer, newIndex: finalOrder.length - 1 }
         })

         const updates = finalOrder.map((id, index) => ({ id, order: index, listId: overContainer }))
         await updateCardOrder(updates)
      }
    }
  }

  const getCardsForList = (listId: string) => {
    const list = state.lists[listId]
    if (!list) return []
    return list.cards.map((id) => state.cards[id]).filter(Boolean)
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

  if (isLoading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>

  return (
    <>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-4 min-h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={state.board?.lists || []} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-4 items-start">
                  {state.board.lists.map((listId) => {
                    const list = state.lists[listId]
                    if (!list) return null
                    return <KanbanList key={list.id} list={list} cards={getCardsForList(list.id)} onCardClick={(c) => setSelectedCard(c)} />
                  })}
                  <div className="flex-shrink-0 w-72">
                    {isAddingList ? (
                      <div className="bg-muted/80 backdrop-blur-sm rounded-xl p-3 space-y-2">
                        <Input autoFocus value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} placeholder="Enter list title..." onKeyDown={(e) => e.key === 'Enter' && handleAddList()} />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={handleAddList}>Add list</Button>
                          <Button variant="ghost" size="icon" onClick={() => setIsAddingList(false)}><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="ghost" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-2 border-dashed border-white/30" onClick={() => setIsAddingList(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add another list
                      </Button>
                    )}
                  </div>
                </div>
              </SortableContext>
              <DragOverlay>
                {activeCard && <div className="rotate-3 scale-105"><KanbanCard card={activeCard} onClick={() => {}} /></div>}
                {activeList && <div className="w-72 bg-muted/80 backdrop-blur-sm rounded-xl p-3 rotate-3 scale-105 opacity-80"><span className="font-semibold text-sm">{activeList.title}</span></div>}
              </DragOverlay>
            </DndContext>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      {selectedCard && <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </>
  )
}
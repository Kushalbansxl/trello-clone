// lib/board-store.ts
'use client'

import { createContext, useContext } from 'react'
import type { BoardState, Card, List, Checklist, ChecklistItem, Comment, Attachment,Label,Member } from './types'

export type BoardAction =
  | { type: 'SET_INITIAL_DATA'; payload: Partial<BoardState> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_LABELS'; payload: string[] }
  | { type: 'SET_FILTER_MEMBERS'; payload: string[] }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SET_FILTER_DUE_DATE'; payload: BoardState['filterDueDate'] }
  | { type: 'UPDATE_BOARD_TITLE'; payload: string }
  | { type: 'UPDATE_BOARD_BACKGROUND'; payload: string }
  | { type: 'ADD_LIST'; payload: { title: string } }
  | { type: 'UPDATE_LIST_TITLE'; payload: { listId: string; title: string } }
  | { type: 'UPDATE_LIST_COLOR'; payload: { listId: string; color: string | null } }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'REORDER_LISTS'; payload: string[] }
  | { type: 'ADD_CARD'; payload: { listId: string; title: string } }
  | { type: 'UPDATE_CARD'; payload: Partial<Card> & { id: string } }
  | { type: 'UPDATE_CARD_COVER'; payload: { cardId: string; coverImage: string | null } }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'ARCHIVE_CARD'; payload: string }
  | { type: 'MOVE_CARD'; payload: { cardId: string; fromListId: string; toListId: string; newIndex: number } }
  | { type: 'REORDER_CARDS'; payload: { listId: string; cardIds: string[] } }
  | { type: 'ADD_CHECKLIST'; payload: { cardId: string; title: string } }
  | { type: 'UPDATE_CHECKLIST'; payload: { cardId: string; checklist: Checklist } }
  | { type: 'DELETE_CHECKLIST'; payload: { cardId: string; checklistId: string } }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: { cardId: string; checklistId: string; text: string } }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: { cardId: string; checklistId: string; item: ChecklistItem } }
  | { type: 'DELETE_CHECKLIST_ITEM'; payload: { cardId: string; checklistId: string; itemId: string } }
  | { type: 'ADD_COMMENT'; payload: { cardId: string; text: string } }
  | { type: 'ADD_ATTACHMENT'; payload: { cardId: string; attachment: Omit<Attachment, 'id' | 'addedAt'> } }
  | { type: 'DELETE_ATTACHMENT'; payload: { cardId: string; attachmentId: string } }
  | { type: 'ADD_LABEL'; payload: Label }
  | { type: 'ADD_MEMBER'; payload: Member }

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return { ...state, ...action.payload }

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }

    case 'SET_FILTER_LABELS':
      return { ...state, filterLabels: action.payload }

    case 'SET_FILTER_MEMBERS':
      return { ...state, filterMembers: action.payload }

    case 'SET_FILTER_DUE_DATE':
      return { ...state, filterDueDate: action.payload }

    case 'UPDATE_BOARD_TITLE':
      return { ...state, board: { ...state.board, title: action.payload } }

    case 'UPDATE_BOARD_BACKGROUND':
      return { ...state, board: { ...state.board, background: action.payload } }
    case 'ADD_LABEL':
      return { ...state, labels: [...state.labels, action.payload] }

    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] }
      
    case 'DELETE_LIST': {
      const listIdToDelete = action.payload
      const newLists = { ...state.lists }
      delete newLists[listIdToDelete] // Remove list object
      
      return {
        ...state,
        board: {
          ...state.board,
          lists: state.board.lists.filter(id => id !== listIdToDelete) // Remove list ID from board array
        },
        lists: newLists
      }
    }

    case 'UPDATE_LIST_COLOR': {
      const list = state.lists[action.payload.listId]
      if (!list) return state
      return {
        ...state,
        lists: {
          ...state.lists,
          [action.payload.listId]: { ...list, color: action.payload.color },
        },
      }
    }

    case 'UPDATE_CARD_COVER': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: { ...card, coverImage: action.payload.coverImage },
        },
      }
    }

    case 'ADD_LIST': {
      const newListId = `list-${generateId()}`
      const newList: List = {
        id: newListId,
        title: action.payload.title,
        boardId: state.board.id,
        position: state.board.lists.length,
        order: state.board.lists.length, // Added to satisfy TS
        color: null,
        cards: [],
      }
      return {
        ...state,
        board: { ...state.board, lists: [...state.board.lists, newListId] },
        lists: { ...state.lists, [newListId]: newList },
      }
    }

    case 'UPDATE_LIST_TITLE': {
      const list = state.lists[action.payload.listId]
      if (!list) return state
      return {
        ...state,
        lists: {
          ...state.lists,
          [action.payload.listId]: { ...list, title: action.payload.title },
        },
      }
    }

    case 'DELETE_LIST': {
      const listId = action.payload
      const list = state.lists[listId]
      if (!list) return state
      
      const newCards = { ...state.cards }
      list.cards.forEach((cardId) => delete newCards[cardId])
      
      const { [listId]: _, ...remainingLists } = state.lists
      
      return {
        ...state,
        board: {
          ...state.board,
          lists: state.board.lists.filter((id) => id !== listId),
        },
        lists: remainingLists,
        cards: newCards,
      }
    }

    case 'REORDER_LISTS':
      return {
        ...state,
        board: { ...state.board, lists: action.payload },
      }

    case 'ADD_CARD': {
      const newCardId = `card-${generateId()}`
      const list = state.lists[action.payload.listId]
      if (!list) return state

      const newCard: Card = {
        id: newCardId,
        title: action.payload.title,
        description: null, // Fixed to be explicitly null instead of ''
        listId: action.payload.listId,
        position: list.cards.length,
        order: list.cards.length, // Added to satisfy TS
        labels: [],
        members: [],
        dueDate: null,
        coverImage: null,
        checklists: [],
        comments: [],
        activities: [
          {
            id: generateId(),
            memberId: state.currentUser.id,
            action: 'created this card',
            createdAt: new Date(),
          },
        ],
        attachments: [],
        archived: false,
        createdAt: new Date(),
      }

      return {
        ...state,
        lists: {
          ...state.lists,
          [action.payload.listId]: {
            ...list,
            cards: [...list.cards, newCardId],
          },
        },
        cards: { ...state.cards, [newCardId]: newCard },
      }
    }

    case 'UPDATE_CARD': {
      const card = state.cards[action.payload.id]
      if (!card) return state
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.id]: { ...card, ...action.payload },
        },
      }
    }

    case 'DELETE_CARD': {
      const cardId = action.payload
      const card = state.cards[cardId]
      if (!card) return state

      const list = state.lists[card.listId]
      if (!list) return state

      const { [cardId]: _, ...remainingCards } = state.cards

      return {
        ...state,
        lists: {
          ...state.lists,
          [card.listId]: {
            ...list,
            cards: list.cards.filter((id) => id !== cardId),
          },
        },
        cards: remainingCards,
      }
    }

    case 'ARCHIVE_CARD': {
      const card = state.cards[action.payload]
      if (!card) return state
      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload]: { ...card, archived: true },
        },
      }
    }

    case 'MOVE_CARD': {
      const { cardId, fromListId, toListId, newIndex } = action.payload
      const card = state.cards[cardId]
      const fromList = state.lists[fromListId]
      const toList = state.lists[toListId]

      if (!card || !fromList || !toList) return state

      const newFromCards = fromList.cards.filter((id) => id !== cardId)
      const newToCards = [...toList.cards]
      
      if (fromListId === toListId) {
        newToCards.splice(newIndex, 0, cardId)
        return {
          ...state,
          lists: {
            ...state.lists,
            [toListId]: { ...toList, cards: newToCards },
          },
          cards: {
            ...state.cards,
            [cardId]: { ...card, listId: toListId },
          },
        }
      }

      newToCards.splice(newIndex, 0, cardId)

      return {
        ...state,
        lists: {
          ...state.lists,
          [fromListId]: { ...fromList, cards: newFromCards },
          [toListId]: { ...toList, cards: newToCards },
        },
        cards: {
          ...state.cards,
          [cardId]: { ...card, listId: toListId },
        },
      }
    }

    case 'REORDER_CARDS': {
      const list = state.lists[action.payload.listId]
      if (!list) return state
      return {
        ...state,
        lists: {
          ...state.lists,
          [action.payload.listId]: { ...list, cards: action.payload.cardIds },
        },
      }
    }

    case 'ADD_CHECKLIST': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      const newChecklist: Checklist = {
        id: `checklist-${generateId()}`,
        title: action.payload.title,
        items: [],
      }

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: [...card.checklists, newChecklist],
          },
        },
      }
    }

    case 'UPDATE_CHECKLIST': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: card.checklists.map((cl) =>
              cl.id === action.payload.checklist.id ? action.payload.checklist : cl
            ),
          },
        },
      }
    }

    case 'DELETE_CHECKLIST': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: card.checklists.filter((cl) => cl.id !== action.payload.checklistId),
          },
        },
      }
    }

    case 'ADD_CHECKLIST_ITEM': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      const newItem: ChecklistItem = {
        id: `item-${generateId()}`,
        text: action.payload.text,
        completed: false,
      }

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: card.checklists.map((cl) =>
              cl.id === action.payload.checklistId
                ? { ...cl, items: [...cl.items, newItem] }
                : cl
            ),
          },
        },
      }
    }

    case 'UPDATE_CHECKLIST_ITEM': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: card.checklists.map((cl) =>
              cl.id === action.payload.checklistId
                ? {
                    ...cl,
                    items: cl.items.map((item) =>
                      item.id === action.payload.item.id ? action.payload.item : item
                    ),
                  }
                : cl
            ),
          },
        },
      }
    }

    case 'DELETE_CHECKLIST_ITEM': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            checklists: card.checklists.map((cl) =>
              cl.id === action.payload.checklistId
                ? { ...cl, items: cl.items.filter((item) => item.id !== action.payload.itemId) }
                : cl
            ),
          },
        },
      }
    }

    case 'ADD_COMMENT': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      const newComment: Comment = {
        id: `comment-${generateId()}`,
        memberId: state.currentUser.id,
        text: action.payload.text,
        createdAt: new Date(),
      }

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            comments: [...card.comments, newComment],
          },
        },
      }
    }

    case 'ADD_ATTACHMENT': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      const newAttachment: Attachment = {
        ...action.payload.attachment,
        id: `attachment-${generateId()}`,
        addedAt: new Date(),
      }

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            attachments: [...card.attachments, newAttachment],
          },
        },
      }
    }

    case 'DELETE_ATTACHMENT': {
      const card = state.cards[action.payload.cardId]
      if (!card) return state

      return {
        ...state,
        cards: {
          ...state.cards,
          [action.payload.cardId]: {
            ...card,
            attachments: card.attachments.filter((a) => a.id !== action.payload.attachmentId),
          },
        },
      }
    }

    default:
      return state
  }
}

interface BoardContextType {
  state: BoardState
  dispatch: React.Dispatch<BoardAction>
}

export const BoardContext = createContext<BoardContextType | null>(null)

export function useBoardContext() {
  const context = useContext(BoardContext)
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider')
  }
  return context
}
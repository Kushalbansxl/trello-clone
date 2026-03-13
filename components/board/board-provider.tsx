'use client'

import { useReducer, type ReactNode } from 'react'
import { BoardContext, boardReducer } from '@/lib/board-store'
import { initialBoardState } from '@/lib/sample-data'

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, initialBoardState)

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  )
}

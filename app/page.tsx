'use client'

import { BoardProvider } from '@/components/board/board-provider'
import { NavigationBar } from '@/components/board/navigation-bar'
import { BoardHeader } from '@/components/board/board-header'
import { KanbanBoard } from '@/components/board/kanban-board'
import { useBoardContext } from '@/lib/board-store'

function BoardContent() {
  const { state } = useBoardContext()

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: state.board.background }}
    >
      <NavigationBar />
      <BoardHeader />
      <KanbanBoard />
    </div>
  )
}

export default function Home() {
  return (
    <BoardProvider>
      <BoardContent />
    </BoardProvider>
  )
}

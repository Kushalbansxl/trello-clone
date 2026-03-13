'use client'

import { useState, useRef, useEffect } from 'react'
import { Star, Users, MoreHorizontal, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBoardContext } from '@/lib/board-store'

const backgroundPresets = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
]

export function BoardHeader() {
  const { state, dispatch } = useBoardContext()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(state.board.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const [starred, setStarred] = useState(false)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      dispatch({ type: 'UPDATE_BOARD_TITLE', payload: editTitle.trim() })
    } else {
      setEditTitle(state.board.title)
    }
    setIsEditing(false)
  }

  return (
    <div className="h-14 bg-black/20 backdrop-blur-sm flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') {
                setEditTitle(state.board.title)
                setIsEditing(false)
              }
            }}
            className="h-8 w-auto min-w-[200px] bg-white/20 border-white/30 text-white font-bold text-lg"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-white font-bold text-lg hover:bg-white/10 px-2 py-1 rounded transition-colors"
          >
            {state.board.title}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStarred(!starred)}
          className={`h-8 w-8 text-white hover:bg-white/10 ${starred ? 'text-yellow-400' : ''}`}
        >
          <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
        </Button>

        <div className="h-5 w-px bg-white/20 mx-1" />

        <div className="flex -space-x-2">
          {state.members.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="h-7 w-7 border-2 border-white/20">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="text-[10px] bg-blue-500 text-white">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          ))}
          {state.members.length > 4 && (
            <div className="h-7 w-7 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center">
              <span className="text-white text-[10px] font-medium">+{state.members.length - 4}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 gap-2"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Background</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <h4 className="font-medium mb-3 text-sm">Board Background</h4>
            <div className="grid grid-cols-4 gap-2">
              {backgroundPresets.map((bg, index) => (
                <button
                  key={index}
                  onClick={() => dispatch({ type: 'UPDATE_BOARD_BACKGROUND', payload: bg })}
                  className={`h-10 rounded-md transition-all hover:scale-105 ${
                    state.board.background === bg ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ background: bg }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Board Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Users className="h-4 w-4 mr-2" />
              Manage members
            </DropdownMenuItem>
            <DropdownMenuItem>Copy board</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Close board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

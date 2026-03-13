'use client'

import { useState, useRef } from 'react'
import { useBoardContext } from '@/lib/board-store'
import { 
  Star, Users, MoreHorizontal, LayoutDashboard, Plus, 
  Check, X, Palette, UploadCloud, Trash2, ChevronDown 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createBoard, updateBoardBackground, deleteBoard } from '@/actions/board'

const PRESET_BACKGROUNDS = [
  'linear-gradient(to right bottom, #6366f1, #a855f7, #ec4899)',
  'linear-gradient(to right bottom, #3b82f6, #2dd4bf)',
  'linear-gradient(to right bottom, #f97316, #eab308)',
  'linear-gradient(to right bottom, #ef4444, #f97316)',
  'linear-gradient(to right bottom, #8b5cf6, #3b82f6)',
  'linear-gradient(to right bottom, #10b981, #3b82f6)',
  '#1e293b',
  '#0f172a'
]

export function BoardHeader() {
  const { state, dispatch } = useBoardContext()
  const [isCreating, setIsCreating] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) 
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!state?.board) return null

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return
    setIsLoading(true)
    const res = await createBoard(newBoardTitle.trim())
    if (res.success && res.board) {
      window.location.href = `/?boardId=${res.board.id}`
    } else {
      setIsLoading(false)
    }
  }

  const handleUpdateBackground = async (bgString: string) => {
    dispatch({ type: 'UPDATE_BOARD_BACKGROUND', payload: bgString })
    await updateBoardBackground(state.board.id, bgString)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB")
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      handleUpdateBackground(`url('${base64String}') center / cover no-repeat`)
      setIsUploading(false)
    }
    
    reader.onerror = () => {
      alert("Error reading file")
      setIsUploading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleDeleteBoard = async () => {
    if (window.confirm("Are you sure you want to delete this board? All lists and cards will be permanently removed.")) {
      setIsDeleting(true)
      const res = await deleteBoard(state.board.id)
      if (res.success) {
        window.location.href = '/'
      } else {
        alert("Failed to delete the board.")
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-black/30 backdrop-blur-2xl border-b border-white/10 relative z-10 text-white shadow-sm">
      <div className="flex items-center gap-3">
        
        {/* 🔥 PREMIUM BOARD SWITCHER BUTTON 🔥 */}
        <DropdownMenu onOpenChange={(open) => { if (!open) setIsCreating(false) }}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="text-lg font-bold px-4 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 shadow-sm transition-all duration-300 gap-2 focus-visible:ring-1 focus-visible:ring-white/50"
            >
              <LayoutDashboard className="h-4 w-4 text-white/80" />
              <span className="tracking-tight">{state.board.title}</span>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 z-50 bg-black/80 backdrop-blur-3xl border-white/10 text-white rounded-2xl shadow-2xl p-2">
            <DropdownMenuLabel className="text-white/50 font-medium text-xs uppercase tracking-widest px-2 pb-2">Your Boards</DropdownMenuLabel>
            <ScrollArea className="max-h-[300px]">
              <DropdownMenuGroup className="space-y-1">
                {state.availableBoards?.map((b) => (
                  <DropdownMenuItem 
                    key={b.id} 
                    onClick={() => { if (b.id !== state.board.id) window.location.href = `/?boardId=${b.id}` }} 
                    className={`cursor-pointer justify-between rounded-lg px-3 py-2 transition-colors ${b.id === state.board.id ? 'bg-white/15' : 'hover:bg-white/10 focus:bg-white/10'}`}
                  >
                    <span className="truncate pr-2 font-medium">{b.title}</span>
                    {b.id === state.board.id && <Check className="h-4 w-4 text-white" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </ScrollArea>
            <DropdownMenuSeparator className="bg-white/10 my-2" />
            {isCreating ? (
              <div className="p-2 space-y-2">
                <Input 
                  autoFocus 
                  placeholder="New board title..." 
                  value={newBoardTitle} 
                  onChange={(e) => setNewBoardTitle(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBoard() }} 
                  disabled={isLoading} 
                  className="h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-lg focus-visible:ring-1 focus-visible:ring-white/50" 
                />
                <div className="flex gap-2">
                  <Button size="sm" className="w-full h-8 bg-white text-black hover:bg-white/90 rounded-lg font-bold" onClick={handleCreateBoard} disabled={isLoading || !newBoardTitle.trim()}>
                    Create
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/20 rounded-lg" onClick={() => setIsCreating(false)}>
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setIsCreating(true) }} className="cursor-pointer text-white hover:bg-white/10 focus:bg-white/10 rounded-lg px-3 py-2 font-medium transition-colors">
                <Plus className="mr-2 h-4 w-4" /> Create new board
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-white/20 hidden sm:block ml-2" />
        <Button variant="ghost" className="h-9 hover:bg-white/20 font-medium hidden sm:flex text-white/80 rounded-xl px-3 transition-colors">
          <Users className="mr-2 h-4 w-4" />Workspace visible
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 mr-2">
          <Avatar className="h-8 w-8 border-2 border-transparent ring-2 ring-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform">
            <AvatarFallback className="text-[10px] font-bold bg-white/20 text-white backdrop-blur-md">KB</AvatarFallback>
          </Avatar>
        </div>
        
        {/* Background Palette Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors" title="Change Background">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4 bg-black/80 backdrop-blur-3xl border-white/10 text-white rounded-2xl shadow-2xl z-50">
            <h4 className="font-semibold text-sm mb-4 text-center">Board Background</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 mb-2 block font-bold">Colors & Gradients</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((bg, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleUpdateBackground(bg)}
                      className="h-10 rounded-lg cursor-pointer border border-white/10 hover:border-white/50 hover:scale-110 active:scale-95 transition-all shadow-sm"
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-[10px] uppercase tracking-widest text-white/50 block font-bold mb-2">
                  Custom Background
                </label>
                
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                
                <Button 
                  variant="outline" 
                  className="w-full h-10 border-dashed border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all rounded-xl"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <UploadCloud className="w-4 h-4 mr-2 text-white/70" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
                <p className="text-[10px] text-white/40 text-center mt-1">Max size: 2MB (JPG, PNG)</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* More Options / Delete Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-3xl border-white/10 text-white rounded-xl shadow-2xl p-1">
            <DropdownMenuLabel className="text-white/50 text-xs px-2 py-1.5 uppercase tracking-widest font-bold">Options</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuItem 
              className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer font-medium rounded-lg px-3 py-2 transition-colors" 
              onClick={handleDeleteBoard}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete Board"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  )
}
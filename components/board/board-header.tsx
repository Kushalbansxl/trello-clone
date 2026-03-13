'use client'

import { useState, useRef } from 'react'
import { useBoardContext } from '@/lib/board-store'
// 🔥 Trash2 icon add kiya
import { Star, Users, MoreHorizontal, LayoutDashboard, Plus, Check, X, Palette, UploadCloud, Trash2 } from 'lucide-react'
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
// 🔥 deleteBoard action import kiya
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
  // 🔥 Delete state add ki
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

  // 🔥 DELETE BOARD LOGIC 🔥
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
    <div className="flex h-14 items-center justify-between px-4 bg-black/20 backdrop-blur-sm border-b border-white/10 relative z-10 text-white">
      <div className="flex items-center gap-3">
        
        <DropdownMenu onOpenChange={(open) => { if (!open) setIsCreating(false) }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-lg font-bold px-3 hover:bg-white/20 transition-colors h-9 bg-white/10 shadow-sm border border-white/20">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {state.board.title}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 z-50">
            <DropdownMenuLabel>Your Boards</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-[300px]">
              <DropdownMenuGroup>
                {state.availableBoards?.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => { if (b.id !== state.board.id) window.location.href = `/?boardId=${b.id}` }} className="cursor-pointer justify-between">
                    <span className="truncate pr-2">{b.title}</span>
                    {b.id === state.board.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </ScrollArea>
            <DropdownMenuSeparator />
            {isCreating ? (
              <div className="p-2 space-y-2">
                <Input autoFocus placeholder="New board title..." value={newBoardTitle} onChange={(e) => setNewBoardTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBoard() }} disabled={isLoading} className="h-8 text-sm border-border text-foreground" />
                <div className="flex gap-2">
                  <Button size="sm" className="w-full h-8" onClick={handleCreateBoard} disabled={isLoading || !newBoardTitle.trim()}>Create</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsCreating(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setIsCreating(true) }} className="cursor-pointer text-primary font-medium">
                <Plus className="mr-2 h-4 w-4" /> Create new board
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/20 hidden sm:flex"><Star className="h-4 w-4" /></Button>
        <div className="h-4 w-px bg-white/20 hidden sm:block" />
        <Button variant="ghost" className="h-9 hover:bg-white/20 font-medium hidden sm:flex"><Users className="mr-2 h-4 w-4" />Workspace visible</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex -space-x-2 mr-2">
          <Avatar className="h-8 w-8 border-2 border-background ring-1 ring-white/20 shadow-sm">
            <AvatarFallback className="text-[10px] font-bold bg-indigo-500 text-white">KB</AvatarFallback>
          </Avatar>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/20" title="Change Background">
              <Palette className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4">
            <h4 className="font-semibold text-sm mb-4 text-center">Board Background</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Colors & Gradients</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((bg, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleUpdateBackground(bg)}
                      className="h-10 rounded-md cursor-pointer border border-black/10 hover:scale-105 active:scale-95 transition-all shadow-sm"
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/50">
                <label className="text-xs font-semibold text-muted-foreground block flex items-center gap-1">
                  <UploadCloud className="w-3 h-3" /> Upload Custom Image
                </label>
                
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                
                <Button 
                  variant="outline" 
                  className="w-full h-10 border-dashed border-2 hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Click to Upload Image"}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">Max size: 2MB (JPG, PNG)</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 🔥 MORE MENU WITH DELETE OPTION 🔥 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/20">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Board Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:bg-destructive/10 cursor-pointer font-medium" 
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
'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, MessageSquare, Paperclip, CheckSquare, Image as ImageIcon, X, Upload, Link as LinkIcon, Palette } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBoardContext } from '@/lib/board-store'
import { updateCardCover } from '@/actions/board'
import type { Card } from '@/lib/types'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

interface KanbanCardProps {
  card: Card
  onClick: () => void
}

const COVER_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#94a3b8',
  '#dc2626', '#ea580c', '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777', '#475569'
]

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const { state, dispatch } = useBoardContext()
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [coverUrlInput, setCoverUrlInput] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = { 
    transform: CSS.Translate.toString(transform), // Transform ki jagah Translate!
    transition 
  }

  const cardLabels = state.labels.filter((l) => card.labels.includes(l.id))
  const cardMembers = state.members.filter((m) => card.members.includes(m.id))

  const totalChecklistItems = card.checklists.reduce((sum, cl) => sum + cl.items.length, 0)
  const completedChecklistItems = card.checklists.reduce((sum, cl) => sum + cl.items.filter((i) => i.completed).length, 0)

  const getDueDateStatus = () => {
    if (!card.dueDate) return null
    const date = new Date(card.dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    if (isTomorrow(date)) return 'tomorrow'
    return 'upcoming'
  }

  const dueDateStatus = getDueDateStatus()

  // Apply Cover Logic
  const handleApplyCover = async (value: string | null) => {
    dispatch({ type: 'UPDATE_CARD_COVER', payload: { cardId: card.id, coverImage: value } })
    await updateCardCover(card.id, value)
    setIsCoverModalOpen(false)
    setCoverUrlInput('')
  }

  // Handle Local File Upload (Converts image to Base64 to save in DB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleApplyCover(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCover = async (e: React.MouseEvent) => {
    e.stopPropagation()
    handleApplyCover(null)
  }

  const isColorCover = card.coverImage?.startsWith('#')

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={`group relative bg-card rounded-lg shadow-sm border border-border cursor-pointer hover:border-primary/50 transition-all ${
          isDragging ? 'opacity-50 shadow-lg scale-105 rotate-2 z-50 ring-2 ring-primary' : ''
        }`}
      >
        {/* Dynamic Cover Rendering */}
        {card.coverImage && (
          <div className="relative h-32 rounded-t-lg overflow-hidden group/image border-b border-border/50">
            {isColorCover ? (
              <div className="w-full h-full" style={{ backgroundColor: card.coverImage }} />
            ) : (
              <img src={card.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" crossOrigin="anonymous" />
            )}
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity" />
            <Button 
               variant="destructive" size="icon" 
               className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg rounded-full"
               onClick={handleRemoveCover}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-1">
              {cardLabels.map((label) => (
                <span key={label.id} className="h-2 w-10 rounded-full" style={{ backgroundColor: label.color }} title={label.name} />
              ))}
            </div>
            
            {/* Open Modal Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsCoverModalOpen(true);
              }}
              title="Change Cover"
            >
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          <p className="text-sm font-medium text-card-foreground leading-snug">
            {card.title}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              {card.dueDate && (
                <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${dueDateStatus === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : dueDateStatus === 'today' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-muted'}`}>
                  <Clock className="h-3 w-3" /> {format(new Date(card.dueDate), 'MMM d')}
                </span>
              )}
              {card.description && <span className="text-xs" title="Has description"><MessageSquare className="h-3.5 w-3.5" /></span>}
              {card.attachments.length > 0 && <span className="flex items-center gap-0.5 text-xs"><Paperclip className="h-3.5 w-3.5" /> {card.attachments.length}</span>}
              {totalChecklistItems > 0 && <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${completedChecklistItems === totalChecklistItems ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'}`}><CheckSquare className="h-3.5 w-3.5" /> {completedChecklistItems}/{totalChecklistItems}</span>}
              {card.comments.length > 0 && <span className="flex items-center gap-0.5 text-xs"><MessageSquare className="h-3.5 w-3.5" /> {card.comments.length}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* MODERN COVER MODAL */}
      <Dialog open={isCoverModalOpen} onOpenChange={setIsCoverModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-bold">Card Cover</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="color" className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="color"><Palette className="w-4 h-4 mr-2"/> Color</TabsTrigger>
                <TabsTrigger value="image"><LinkIcon className="w-4 h-4 mr-2"/> Link</TabsTrigger>
                <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2"/> Upload</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 min-h-[150px]">
              {/* TAB 1: COLORS */}
              <TabsContent value="color" className="mt-0 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {COVER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleApplyCover(color)}
                      className="h-12 rounded-md hover:opacity-80 transition-opacity border border-black/10 hover:scale-105 active:scale-95"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* TAB 2: IMAGE URL */}
              <TabsContent value="image" className="mt-0 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground">Paste any image URL</label>
                  <Input 
                    placeholder="https://images.unsplash.com/..." 
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') handleApplyCover(coverUrlInput) }}
                  />
                </div>
                <Button className="w-full" onClick={() => handleApplyCover(coverUrlInput)} disabled={!coverUrlInput}>
                  Apply Image
                </Button>
              </TabsContent>

              {/* TAB 3: UPLOAD DEVICE FILE */}
              <TabsContent value="upload" className="mt-0 space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium">Click to upload</div>
                  <div className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 2MB)</div>
                  {/* Hidden file input stretching over the container */}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
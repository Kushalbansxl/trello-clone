'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, MessageSquare, CheckSquare, Image as ImageIcon, X, Upload, Link as LinkIcon, Palette } from 'lucide-react'
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
  const style = { transform: CSS.Translate.toString(transform), transition }

  const cardLabels = state.labels.filter((l) => card.labels.includes(l.id))
  const cardMembers = state.members.filter((m) => card.members.includes(m.id))

  const totalChecklistItems = card.checklists.reduce((sum, cl) => sum + (cl.items?.length || 0), 0)
  const completedChecklistItems = card.checklists.reduce((sum, cl) => sum + (cl.items?.filter((i: any) => i.completed || i.isCompleted).length || 0), 0)

  const getDueDateStatus = () => {
    if (!card.dueDate) return null
    const date = new Date(card.dueDate)
    if (isPast(date) && !isToday(date)) return 'overdue'
    if (isToday(date)) return 'today'
    if (isTomorrow(date)) return 'tomorrow'
    return 'upcoming'
  }

  const dueDateStatus = getDueDateStatus()

  const handleApplyCover = async (value: string | null) => {
    dispatch({ type: 'UPDATE_CARD_COVER', payload: { cardId: card.id, coverImage: value } })
    await updateCardCover(card.id, value)
    setIsCoverModalOpen(false)
    setCoverUrlInput('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => handleApplyCover(reader.result as string)
      reader.readAsDataURL(file)
    }
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
        className={`group relative bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/10 cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-lg transition-all duration-300 overflow-hidden ${
          isDragging ? 'opacity-60 shadow-2xl scale-105 rotate-2 z-50 ring-1 ring-primary' : ''
        }`}
      >
        {/* Cover Rendering */}
        {card.coverImage && (
          <div className="relative h-28 w-full group/image border-b border-white/5">
            {isColorCover ? (
              <div className="w-full h-full" style={{ backgroundColor: card.coverImage }} />
            ) : (
              <img src={card.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105" crossOrigin="anonymous" />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity" />
            <Button 
               variant="destructive" size="icon" 
               className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity shadow-lg rounded-full"
               onClick={(e) => { e.stopPropagation(); handleApplyCover(null) }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="p-3.5 space-y-2.5">
          <div className="flex items-start justify-between">
            {cardLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cardLabels.map((label) => (
                  <span key={label.id} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-white shadow-sm" style={{ backgroundColor: label.color }} title={label.name}>
                    {label.name}
                  </span>
                ))}
              </div>
            )}
            
            {/* Quick Edit Cover Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1 text-white/50 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setIsCoverModalOpen(true); }}
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-sm font-semibold text-white/95 leading-snug tracking-wide drop-shadow-sm">
            {card.title}
          </p>

          <div className="flex items-end justify-between pt-1">
            {/* Icons row */}
            <div className="flex flex-wrap items-center gap-2.5 text-white/40">
              {card.dueDate && (
                <span className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md border ${
                  dueDateStatus === 'overdue' ? 'bg-red-500/20 border-red-500/30 text-red-300' 
                  : dueDateStatus === 'today' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' 
                  : 'bg-white/5 border-white/10 text-white/60'
                }`}>
                  <Clock className="h-3 w-3" /> {format(new Date(card.dueDate), 'MMM d')}
                </span>
              )}
              {card.description && <span title="Has description"><MessageSquare className="h-3.5 w-3.5" /></span>}
              {totalChecklistItems > 0 && (
                <span className={`flex items-center gap-1 text-[11px] font-medium ${completedChecklistItems === totalChecklistItems ? 'text-emerald-400' : ''}`}>
                  <CheckSquare className="h-3.5 w-3.5" /> {completedChecklistItems}/{totalChecklistItems}
                </span>
              )}
            </div>

            {/* Avatars */}
            {cardMembers.length > 0 && (
              <div className="flex -space-x-1.5 shrink-0">
                {cardMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="h-6 w-6 border-2 border-black ring-1 ring-white/10 shadow-sm">
                    <AvatarImage src={member.avatar || ''} />
                    <AvatarFallback className="text-[9px] font-bold bg-primary text-primary-foreground">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COVER MODAL */}
      <Dialog open={isCoverModalOpen} onOpenChange={setIsCoverModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="sr-only">Change Cover</DialogTitle>
          <DialogHeader className="p-4 pb-0">
            <h3 className="text-lg font-bold">Card Cover</h3>
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
              <TabsContent value="color" className="mt-0 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {COVER_COLORS.map((color) => (
                    <button key={color} onClick={() => handleApplyCover(color)} className="h-10 rounded-lg hover:opacity-80 transition-all hover:scale-105 active:scale-95 shadow-sm" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="image" className="mt-0 space-y-3">
                <Input placeholder="Image URL (e.g. Unsplash)" value={coverUrlInput} onChange={(e) => setCoverUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCover(coverUrlInput)} />
                <Button className="w-full" onClick={() => handleApplyCover(coverUrlInput)} disabled={!coverUrlInput}>Apply Image</Button>
              </TabsContent>
              <TabsContent value="upload" className="mt-0 space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors relative">
                  <Upload className="w-6 h-6 text-primary mb-2" />
                  <div className="text-sm font-medium">Click to upload</div>
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
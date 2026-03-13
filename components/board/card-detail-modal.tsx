'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  X, AlignLeft, CheckSquare, Clock, Tag, UserPlus, 
  CreditCard, Layout, Plus, CalendarIcon, Check, Trash2, ChevronLeft, Image as ImageIcon 
} from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

import { useBoardContext } from '@/lib/board-store'
import type { Card, Checklist } from '@/lib/types'
import { 
  toggleCardLabel, toggleCardMember, updateCardDueDate, 
  addChecklist, addChecklistItem, toggleChecklistItem,
  updateCardDescription, deleteChecklist, deleteCard,
  addMemberByName, createLabel, updateCardCover
} from '@/actions/board'

interface CardDetailModalProps {
  card: Card
  onClose: () => void
}

const LABEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b']

export function CardDetailModal({ card: initialCard, onClose }: CardDetailModalProps) {
  const { state, dispatch } = useBoardContext()
  const card = state.cards[initialCard.id] || initialCard
  const parentList = state.lists[card.listId]

  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({})
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descInput, setDescInput] = useState(card.description || '')
  const [coverUrlInput, setCoverUrlInput] = useState('')

  // 🔥 MEMBERS STATE
  const [newMemberName, setNewMemberName] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  
  // 🔥 LABELS STATE
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[4])
  const [isSavingLabel, setIsSavingLabel] = useState(false)

  // --- ACTIONS ---

  const handleApplyCover = async (value: string | null) => {
    dispatch({ type: 'UPDATE_CARD_COVER', payload: { cardId: card.id, coverImage: value } })
    await updateCardCover(card.id, value)
  }

  // 1. SELECT/UNSELECT LABEL
  const handleToggleLabel = async (e: React.MouseEvent, labelId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const hasLabel = card.labels.includes(labelId)
    const newLabels = hasLabel ? card.labels.filter(id => id !== labelId) : [...card.labels, labelId]
    
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, labels: newLabels } })
    await toggleCardLabel(card.id, labelId, hasLabel)
  }

  // 2. CREATE NEW LABEL
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return
    setIsSavingLabel(true)
    const res = await createLabel(state.board.id, newLabelName.trim(), newLabelColor)
    
    if (res.success && res.label) {
      // Board mein label add karo
      dispatch({ type: 'ADD_LABEL', payload: res.label })
      // Turant is card ko assign kar do
      const newLabels = [...card.labels, res.label.id]
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, labels: newLabels } })
      await toggleCardLabel(card.id, res.label.id, false)
      
      setIsCreatingLabel(false)
      setNewLabelName('')
    }
    setIsSavingLabel(false)
  }

  // 3. SELECT/UNSELECT MEMBER
  const handleToggleMember = async (e: React.MouseEvent, memberId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const hasMember = card.members.includes(memberId)
    const newMembers = hasMember ? card.members.filter(id => id !== memberId) : [...card.members, memberId]
    
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, members: newMembers } })
    await toggleCardMember(card.id, memberId, hasMember)
  }

  // 4. CREATE NEW MEMBER
  const handleAddMember = async () => {
    if (!newMemberName.trim()) return
    setIsInviting(true)
    const res = await addMemberByName(state.board.id, newMemberName.trim())
    
    if (res.success && res.member) {
      dispatch({ type: 'ADD_MEMBER', payload: res.member })
      const newMembers = [...card.members, res.member.id]
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, members: newMembers } })
      await toggleCardMember(card.id, res.member.id, false)
      
      setNewMemberName('')
    }
    setIsInviting(false)
  }

  // ... (Baki saare existing actions Checklists aur Date ke yahan rahenge)
  const handleDateSelect = async (date: Date | undefined) => {
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, dueDate: date || null } })
    await updateCardDueDate(card.id, date || null)
  }
  const handleSaveDescription = async () => {
    const newDesc = descInput.trim() || null
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, description: newDesc } })
    setIsEditingDesc(false)
    await updateCardDescription(card.id, newDesc)
  }
  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return
    const res = await addChecklist(card.id, newChecklistTitle.trim())
    if (res.success && res.checklist) {
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, checklists: [...card.checklists, { ...res.checklist, items: [] }] } })
    }
    setNewChecklistTitle('')
  }
  const handleDeleteChecklist = async (checklistId: string) => {
    const updatedChecklists = card.checklists.filter(cl => cl.id !== checklistId)
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, checklists: updatedChecklists } })
    await deleteChecklist(checklistId)
  }
  const handleAddChecklistItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId]?.trim()
    if (!text) return
    const res = await addChecklistItem(checklistId, text)
    if (res.success && res.item) {
      const updatedChecklists = card.checklists.map(cl => cl.id === checklistId ? { ...cl, items: [...cl.items, { id: res.item.id, text: res.item.text, completed: res.item.isCompleted }] } : cl)
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, checklists: updatedChecklists } })
    }
    setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }))
  }
  const handleToggleItem = async (checklistId: string, itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const updatedChecklists = card.checklists.map(cl => cl.id === checklistId ? { ...cl, items: cl.items.map(item => item.id === itemId ? { ...item, completed: newStatus, isCompleted: newStatus } : item) } : cl)
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, checklists: updatedChecklists } })
    await toggleChecklistItem(itemId, newStatus)
  }
  const handleDeleteCard = async () => {
    dispatch({ type: 'DELETE_CARD', payload: card.id })
    onClose()
    await deleteCard(card.id)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[768px] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <DialogTitle className="sr-only">{card.title} Details</DialogTitle>

        {card.coverImage && (
          <div className="w-full h-32 relative">
            {card.coverImage.startsWith('#') ? (
               <div className="w-full h-full" style={{ backgroundColor: card.coverImage }} />
            ) : (
               <img src={card.coverImage} alt="Cover" className="w-full h-full object-cover" crossOrigin="anonymous" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50" />
          </div>
        )}

        <div className="p-6 pt-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-start gap-4 w-full">
            <CreditCard className="w-6 h-6 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 space-y-1.5">
              <h2 className="text-xl font-bold leading-tight">{card.title}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                in list <span className="underline decoration-primary underline-offset-2">{parentList?.title}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 -mt-2 -mr-2" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-8 mt-8">
            <div className="flex-1 space-y-8 min-w-0">
              
              {/* Badges Display Area */}
              <div className="flex flex-wrap gap-6">
                {card.members.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Members</h3>
                    <div className="flex -space-x-2">
                      {card.members.map(memberId => {
                        const member = state.members.find(m => m.id === memberId)
                        if (!member) return null
                        return (
                          <Avatar key={member.id} className="w-8 h-8 border-2 border-background ring-1 ring-border/20 shadow-sm" title={member.name}>
                            <AvatarImage src={member.avatar || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{member.name[0]}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                  </div>
                )}
                {card.labels.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {card.labels.map(labelId => {
                        const label = state.labels.find(l => l.id === labelId)
                        if (!label) return null
                        return (
                          <Badge key={label.id} className="h-8 px-3 rounded-md shadow-sm font-medium" style={{ backgroundColor: label.color, color: '#fff' }}>{label.name}</Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
                {card.dueDate && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Due Date</h3>
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
                      <Checkbox checked={false} />
                      <span className="text-sm font-medium">{format(new Date(card.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex gap-4">
                <AlignLeft className="w-6 h-6 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-base font-semibold">Description</h3>
                  {isEditingDesc ? (
                    <div className="space-y-3">
                      <Textarea 
                        autoFocus value={descInput} onChange={e => setDescInput(e.target.value)}
                        placeholder="Add a more detailed description..."
                        className="min-h-[120px] resize-y bg-background/50 border-white/20 focus-visible:ring-primary"
                      />
                      <div className="flex gap-2 items-center">
                        <Button onClick={handleSaveDescription}>Save</Button>
                        <Button variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setIsEditingDesc(true)} className="bg-muted/40 hover:bg-muted/60 transition-colors rounded-lg p-3 min-h-[80px] cursor-pointer border border-transparent hover:border-border/50">
                      {card.description ? <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{card.description}</p> : <p className="text-sm text-muted-foreground">Add a more detailed description...</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Checklists Display */}
              {card.checklists.map((checklist: Checklist) => {
                const total = checklist.items?.length || 0
                const completed = checklist.items?.filter((i: any) => i.completed || i.isCompleted).length || 0
                const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

                return (
                  <div key={checklist.id} className="flex gap-4">
                    <CheckSquare className="w-6 h-6 text-muted-foreground shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{checklist.title}</h3>
                        <Button variant="secondary" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDeleteChecklist(checklist.id)}>Delete</Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium w-8 text-right text-muted-foreground">{percent}%</span>
                        <Progress value={percent} className="h-2" />
                      </div>
                      <div className="space-y-2 pt-2">
                        {checklist.items?.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-3 group hover:bg-muted/30 p-1.5 rounded-md transition-colors">
                            <Checkbox checked={item.completed || item.isCompleted} onCheckedChange={() => handleToggleItem(checklist.id, item.id, item.completed || item.isCompleted)} className="mt-0.5" />
                            <span className={`text-sm ${item.completed || item.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <Input placeholder="Add an item..." className="h-9 text-sm" value={newItemTexts[checklist.id] || ''} onChange={e => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))} onKeyDown={e => { if(e.key === 'Enter') handleAddChecklistItem(checklist.id) }} />
                          <Button size="sm" className="h-9" onClick={() => handleAddChecklistItem(checklist.id)}>Add</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* SIDEBAR ACTIONS */}
            <div className="w-[180px] shrink-0 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Add to card</h4>
                
                {/* 🔥 MEMBERS POPOVER 🔥 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium shadow-sm"><UserPlus className="w-4 h-4 mr-2" /> Members</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-3 z-[100]">
                    <h4 className="font-semibold text-sm mb-3 text-center">Board Members</h4>
                    
                    {/* 1. Create Form */}
                    <div className="flex gap-2 mb-4 pb-4 border-b border-border/50">
                      <Input 
                        placeholder="Type a new name..." className="h-8 text-xs" 
                        value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') handleAddMember() }}
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={handleAddMember} disabled={!newMemberName || isInviting}>
                        {isInviting ? "..." : "Create"}
                      </Button>
                    </div>

                    {/* 2. Select from Existing */}
                    <div className="space-y-1">
                      {state.members.length === 0 ? (
                         <p className="text-xs text-center text-muted-foreground py-2">No members yet. Create one above!</p>
                      ) : (
                         state.members.map(member => (
                          <div key={member.id} onClick={(e) => handleToggleMember(e, member.id)} className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6"><AvatarImage src={member.avatar || ''}/><AvatarFallback className="text-[10px]">{member.name[0]}</AvatarFallback></Avatar>
                              <span className="text-sm font-medium truncate max-w-[120px]">{member.name}</span>
                            </div>
                            {card.members.includes(member.id) && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 🔥 LABELS POPOVER 🔥 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium shadow-sm"><Tag className="w-4 h-4 mr-2" /> Labels</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-[100]">
                    {!isCreatingLabel ? (
                      <>
                        <h4 className="font-semibold text-sm mb-3 text-center">Labels</h4>
                        
                        {/* Select from Existing */}
                        <div className="space-y-2 mb-3">
                          {state.labels.length === 0 ? (
                            <p className="text-xs text-center text-muted-foreground py-2 border-b border-border/50 mb-3">No labels yet.</p>
                          ) : (
                            state.labels.map(label => (
                              <div key={label.id} onClick={(e) => handleToggleLabel(e, label.id)} className="flex items-center gap-2 group cursor-pointer">
                                <div className="flex-1 h-8 rounded-md flex items-center px-3 text-white font-medium text-sm transition-opacity group-hover:opacity-90 relative" style={{ backgroundColor: label.color }}>
                                  {label.name}
                                  {card.labels.includes(label.id) && <Check className="w-4 h-4 absolute right-2" />}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Go to Create Form */}
                        <Button variant="outline" className="w-full h-8 text-xs font-semibold" onClick={() => setIsCreatingLabel(true)}>
                          Create a new label
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {/* Create Form */}
                        <div className="flex items-center gap-2 mb-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreatingLabel(false)}><ChevronLeft className="h-4 w-4"/></Button>
                          <h4 className="font-semibold text-sm text-center flex-1 pr-6">Create Label</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Title</label>
                          <Input autoFocus value={newLabelName} onChange={e => setNewLabelName(e.target.value)} className="h-8 text-sm" placeholder="e.g. Bug, Feature..." />
                        </div>
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-medium text-muted-foreground">Color</label>
                          <div className="grid grid-cols-4 gap-2">
                            {LABEL_COLORS.map(c => (
                              <div key={c} onClick={() => setNewLabelColor(c)} className={`h-8 rounded-md cursor-pointer border-2 transition-all hover:scale-105 ${newLabelColor === c ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <Button className="w-full h-8 mt-2" onClick={handleCreateLabel} disabled={isSavingLabel || !newLabelName.trim()}>
                          {isSavingLabel ? "Creating..." : "Create Label"}
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium shadow-sm">
                      <ImageIcon className="w-4 h-4 mr-2" /> Cover
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-[100]">
                    <h4 className="font-semibold text-sm mb-3 text-center">Card Cover</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Colors</label>
                        <div className="grid grid-cols-4 gap-2">
                          {LABEL_COLORS.map(c => (
                            <div key={c} onClick={() => handleApplyCover(c)} className="h-8 rounded-md cursor-pointer hover:opacity-80 transition-opacity hover:scale-105" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <label className="text-xs font-semibold text-muted-foreground block">Image URL</label>
                        <Input placeholder="Paste image link..." value={coverUrlInput} onChange={(e) => setCoverUrlInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleApplyCover(coverUrlInput) }} className="h-8 text-sm" />
                        <Button className="w-full h-8" onClick={() => handleApplyCover(coverUrlInput)} disabled={!coverUrlInput}>Apply Image</Button>
                      </div>
                      {card.coverImage && (
                        <div className="pt-2 border-t border-border/50">
                          <Button variant="destructive" className="w-full h-8" onClick={() => handleApplyCover(null)}>Remove Cover</Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium shadow-sm"><CheckSquare className="w-4 h-4 mr-2" /> Checklist</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 z-[100]">
                    <h4 className="font-semibold text-sm mb-3 text-center">Add Checklist</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Title</label>
                        <Input autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} placeholder="Checklist" onKeyDown={e => { if(e.key === 'Enter') handleAddChecklist() }} />
                      </div>
                      <Button className="w-full" onClick={handleAddChecklist} disabled={!newChecklistTitle.trim()}>Add</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium shadow-sm"><Clock className="w-4 h-4 mr-2" /> Dates</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 z-[100]">
                    <Calendar mode="single" selected={card.dueDate ? new Date(card.dueDate) : undefined} onSelect={handleDateSelect} initialFocus />
                    {card.dueDate && (
                      <div className="p-3 border-t border-border">
                        <Button variant="destructive" className="w-full h-8" onClick={() => handleDateSelect(undefined)}>Remove Due Date</Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 pt-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Actions</h4>
                <Button variant="secondary" className="w-full justify-start h-9 text-sm font-medium text-destructive hover:bg-destructive hover:text-white transition-colors" onClick={handleDeleteCard}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Card
                </Button>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
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

  const [newMemberName, setNewMemberName] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  
  const [isCreatingLabel, setIsCreatingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[4])
  const [isSavingLabel, setIsSavingLabel] = useState(false)

  // --- ACTIONS ---

  const handleApplyCover = async (value: string | null) => {
    dispatch({ type: 'UPDATE_CARD_COVER', payload: { cardId: card.id, coverImage: value } })
    await updateCardCover(card.id, value)
  }

  const handleToggleLabel = async (e: React.MouseEvent, labelId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const hasLabel = card.labels.includes(labelId)
    const newLabels = hasLabel ? card.labels.filter(id => id !== labelId) : [...card.labels, labelId]
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, labels: newLabels } })
    await toggleCardLabel(card.id, labelId, hasLabel)
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return
    setIsSavingLabel(true)
    const res = await createLabel(state.board.id, newLabelName.trim(), newLabelColor)
    if (res.success && res.label) {
      dispatch({ type: 'ADD_LABEL', payload: res.label })
      const newLabels = [...card.labels, res.label.id]
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, labels: newLabels } })
      await toggleCardLabel(card.id, res.label.id, false)
      setIsCreatingLabel(false)
      setNewLabelName('')
    }
    setIsSavingLabel(false)
  }

  const handleToggleMember = async (e: React.MouseEvent, memberId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const hasMember = card.members.includes(memberId)
    const newMembers = hasMember ? card.members.filter(id => id !== memberId) : [...card.members, memberId]
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, members: newMembers } })
    await toggleCardMember(card.id, memberId, hasMember)
  }

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
      {/* 100% SOLID BACKGROUND (zinc-950) */}
      <DialogContent
        className="sm:max-w-[768px] p-0 bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100 [&>button]:text-zinc-400 [&>button]:hover:text-white"
        onClick={e => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{card.title} Details</DialogTitle>

        {card.coverImage && (
          <div className="w-full h-32 relative">
            {card.coverImage.startsWith('#') ? (
               <div className="w-full h-full" style={{ backgroundColor: card.coverImage }} />
            ) : (
               <img src={card.coverImage} alt="Cover" className="w-full h-full object-cover" crossOrigin="anonymous" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-90" />
          </div>
        )}

        <div className="p-6 pt-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex items-start gap-4 w-full">
            <CreditCard className="w-6 h-6 mt-1 text-zinc-400 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <h2 className="text-xl font-bold leading-tight text-white">{card.title}</h2>
              <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                in list <span className="underline decoration-zinc-600 underline-offset-2 text-zinc-200">{parentList?.title}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-8 mt-8">
            <div className="flex-1 space-y-8 min-w-0">
              
              {/* Badges Display Area */}
              <div className="flex flex-wrap gap-6">
                {card.members.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Members</h3>
                    <div className="flex -space-x-2">
                      {card.members.map(memberId => {
                        const member = state.members.find(m => m.id === memberId)
                        if (!member) return null
                        return (
                          <Avatar key={member.id} className="w-8 h-8 border-2 border-zinc-950 ring-1 ring-zinc-800 shadow-sm" title={member.name}>
                            <AvatarImage src={member.avatar || ''} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{member.name[0]}</AvatarFallback>
                          </Avatar>
                        )
                      })}
                    </div>
                  </div>
                )}
                {card.labels.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Labels</h3>
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
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Due Date</h3>
                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">
                      <Checkbox checked={false} className="border-zinc-500" />
                      <span className="text-sm font-medium text-zinc-100">{format(new Date(card.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex gap-4">
                <AlignLeft className="w-6 h-6 text-zinc-400 shrink-0" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-base font-semibold text-white">Description</h3>
                  {isEditingDesc ? (
                    <div className="space-y-3">
                      <Textarea 
                        autoFocus value={descInput} onChange={e => setDescInput(e.target.value)}
                        placeholder="Add a more detailed description..."
                        className="min-h-[120px] resize-y bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-primary"
                      />
                      <div className="flex gap-2 items-center">
                        <Button onClick={handleSaveDescription} className="bg-white text-black hover:bg-zinc-200">Save</Button>
                        <Button variant="ghost" onClick={() => setIsEditingDesc(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setIsEditingDesc(true)} className="bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-lg p-3 min-h-[80px] cursor-pointer border border-transparent">
                      {card.description ? <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">{card.description}</p> : <p className="text-sm text-zinc-500">Add a more detailed description...</p>}
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
                    <CheckSquare className="w-6 h-6 text-zinc-400 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">{checklist.title}</h3>
                        <Button variant="ghost" size="sm" className="h-7 text-xs bg-zinc-900 text-red-400 hover:bg-red-900/30 hover:text-red-300" onClick={() => handleDeleteChecklist(checklist.id)}>Delete</Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium w-8 text-right text-zinc-400">{percent}%</span>
                        <Progress value={percent} className="h-2 bg-zinc-800 [&>div]:bg-primary" />
                      </div>
                      <div className="space-y-2 pt-2">
                        {checklist.items?.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-3 group hover:bg-zinc-900 p-1.5 rounded-md transition-colors">
                            <Checkbox checked={item.completed || item.isCompleted} onCheckedChange={() => handleToggleItem(checklist.id, item.id, item.completed || item.isCompleted)} className="mt-0.5 border-zinc-500" />
                            <span className={`text-sm ${item.completed || item.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <Input placeholder="Add an item..." className="h-9 text-sm bg-transparent border-zinc-800 text-white placeholder:text-zinc-500" value={newItemTexts[checklist.id] || ''} onChange={e => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))} onKeyDown={e => { if(e.key === 'Enter') handleAddChecklistItem(checklist.id) }} />
                          <Button size="sm" className="h-9 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">Add</Button>
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
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-white">Add to card</h4>
                
                {/* MEMBERS POPOVER */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-none"><UserPlus className="w-4 h-4 mr-2 text-zinc-400" /> Members</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-3 bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                    <h4 className="font-semibold text-sm mb-3 text-center">Board Members</h4>
                    
                    <div className="flex gap-2 mb-4 pb-4 border-b border-zinc-800">
                      <Input 
                        placeholder="Type a new name..." className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white" 
                        value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') handleAddMember() }}
                      />
                      <Button size="sm" className="h-8 text-xs bg-white text-black hover:bg-zinc-200" onClick={handleAddMember} disabled={!newMemberName || isInviting}>
                        {isInviting ? "..." : "Create"}
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {state.members.length === 0 ? (
                         <p className="text-xs text-center text-zinc-500 py-2">No members yet. Create one above!</p>
                      ) : (
                         state.members.map(member => (
                          <div key={member.id} onClick={(e) => handleToggleMember(e, member.id)} className="flex items-center justify-between p-2 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 border border-zinc-800"><AvatarImage src={member.avatar || ''}/><AvatarFallback className="text-[10px] bg-primary text-white">{member.name[0]}</AvatarFallback></Avatar>
                              <span className="text-sm font-medium truncate max-w-[120px]">{member.name}</span>
                            </div>
                            {card.members.includes(member.id) && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* LABELS POPOVER */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-none"><Tag className="w-4 h-4 mr-2 text-zinc-400" /> Labels</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                    {!isCreatingLabel ? (
                      <>
                        <h4 className="font-semibold text-sm mb-3 text-center">Labels</h4>
                        <div className="space-y-2 mb-3">
                          {state.labels.length === 0 ? (
                            <p className="text-xs text-center text-zinc-500 py-2 border-b border-zinc-800 mb-3">No labels yet.</p>
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
                        <Button variant="outline" className="w-full h-8 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800" onClick={() => setIsCreatingLabel(true)}>
                          Create a new label
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={() => setIsCreatingLabel(false)}><ChevronLeft className="h-4 w-4"/></Button>
                          <h4 className="font-semibold text-sm text-center flex-1 pr-6 text-white">Create Label</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-zinc-400">Title</label>
                          <Input autoFocus value={newLabelName} onChange={e => setNewLabelName(e.target.value)} className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white" placeholder="e.g. Bug, Feature..." />
                        </div>
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-medium text-zinc-400">Color</label>
                          <div className="grid grid-cols-4 gap-2">
                            {LABEL_COLORS.map(c => (
                              <div key={c} onClick={() => setNewLabelColor(c)} className={`h-8 rounded-md cursor-pointer border-2 transition-all hover:scale-105 ${newLabelColor === c ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <Button className="w-full h-8 mt-2 bg-white text-black hover:bg-zinc-200" onClick={handleCreateLabel} disabled={isSavingLabel || !newLabelName.trim()}>
                          {isSavingLabel ? "Creating..." : "Create Label"}
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* COVER POPOVER */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-none">
                      <ImageIcon className="w-4 h-4 mr-2 text-zinc-400" /> Cover
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                    <h4 className="font-semibold text-sm mb-3 text-center">Card Cover</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 block">Colors</label>
                        <div className="grid grid-cols-4 gap-2">
                          {LABEL_COLORS.map(c => (
                            <div key={c} onClick={() => handleApplyCover(c)} className="h-8 rounded-md cursor-pointer hover:opacity-80 transition-opacity hover:scale-105" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <label className="text-xs font-semibold text-zinc-400 block">Image URL</label>
                        <Input placeholder="Paste image link..." value={coverUrlInput} onChange={(e) => setCoverUrlInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleApplyCover(coverUrlInput) }} className="h-8 text-xs bg-zinc-900 border-zinc-800 text-white" />
                        <Button className="w-full h-8 bg-white text-black hover:bg-zinc-200" onClick={() => handleApplyCover(coverUrlInput)} disabled={!coverUrlInput}>Apply Image</Button>
                      </div>
                      {card.coverImage && (
                        <div className="pt-2 border-t border-zinc-800">
                          <Button variant="outline" className="w-full h-8 bg-zinc-900 border-transparent text-red-400 hover:bg-red-900/30 hover:text-red-300" onClick={() => handleApplyCover(null)}>Remove Cover</Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* CHECKLIST POPOVER */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-none"><CheckSquare className="w-4 h-4 mr-2 text-zinc-400" /> Checklist</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3 bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                    <h4 className="font-semibold text-sm mb-3 text-center">Add Checklist</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-400">Title</label>
                        <Input autoFocus value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} placeholder="Checklist" onKeyDown={e => { if(e.key === 'Enter') handleAddChecklist() }} className="bg-zinc-900 border-zinc-800 text-white" />
                      </div>
                      <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={handleAddChecklist} disabled={!newChecklistTitle.trim()}>Add</Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* DATES POPOVER */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-none"><Clock className="w-4 h-4 mr-2 text-zinc-400" /> Dates</Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                    <Calendar mode="single" selected={card.dueDate ? new Date(card.dueDate) : undefined} onSelect={handleDateSelect} initialFocus />
                    {card.dueDate && (
                      <div className="p-3 border-t border-zinc-800">
                        <Button variant="outline" className="w-full h-8 bg-zinc-900 border-transparent text-red-400 hover:bg-red-900/30 hover:text-red-300" onClick={() => handleDateSelect(undefined)}>Remove Due Date</Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 text-white">Actions</h4>
                <Button variant="outline" className="w-full justify-start h-9 text-sm font-medium bg-zinc-900 border-transparent text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors" onClick={handleDeleteCard}>
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
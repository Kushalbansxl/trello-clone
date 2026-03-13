'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  CreditCard,
  AlignLeft,
  Tag,
  Users,
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Archive,
  Trash2,
  Plus,
  Image as ImageIcon,
  Clock,
  Activity,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useBoardContext } from '@/lib/board-store'
import type { Card, Checklist } from '@/lib/types'

interface CardDetailModalProps {
  card: Card
  onClose: () => void
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const { state, dispatch } = useBoardContext()
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [showActivity, setShowActivity] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const currentCard = state.cards[card.id] || card

  const cardLabels = state.labels.filter((l) => currentCard.labels.includes(l.id))
  const cardMembers = state.members.filter((m) => currentCard.members.includes(m.id))
  const currentList = state.lists[currentCard.listId]

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  const handleSaveTitle = () => {
    if (title.trim() && title !== currentCard.title) {
      dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, title: title.trim() } })
    } else {
      setTitle(currentCard.title)
    }
    setEditingTitle(false)
  }

  const handleSaveDescription = () => {
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, description } })
    setEditingDescription(false)
  }

  const handleToggleLabel = (labelId: string) => {
    const newLabels = currentCard.labels.includes(labelId)
      ? currentCard.labels.filter((id) => id !== labelId)
      : [...currentCard.labels, labelId]
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, labels: newLabels } })
  }

  const handleToggleMember = (memberId: string) => {
    const newMembers = currentCard.members.includes(memberId)
      ? currentCard.members.filter((id) => id !== memberId)
      : [...currentCard.members, memberId]
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, members: newMembers } })
  }

  const handleSetDueDate = (date: Date | undefined) => {
    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, dueDate: date || null } })
  }

  const handleAddChecklist = () => {
    if (newChecklistTitle.trim()) {
      dispatch({
        type: 'ADD_CHECKLIST',
        payload: { cardId: card.id, title: newChecklistTitle.trim() },
      })
      setNewChecklistTitle('')
    }
    setAddingChecklist(false)
  }

  const handleAddChecklistItem = (checklistId: string) => {
    if (newItemText.trim()) {
      dispatch({
        type: 'ADD_CHECKLIST_ITEM',
        payload: { cardId: card.id, checklistId, text: newItemText.trim() },
      })
      setNewItemText('')
    }
    setAddingItemTo(null)
  }

  const handleToggleChecklistItem = (checklistId: string, itemId: string, completed: boolean) => {
    const checklist = currentCard.checklists.find((cl) => cl.id === checklistId)
    const item = checklist?.items.find((i) => i.id === itemId)
    if (item) {
      dispatch({
        type: 'UPDATE_CHECKLIST_ITEM',
        payload: { cardId: card.id, checklistId, item: { ...item, completed } },
      })
    }
  }

  const handleDeleteChecklist = (checklistId: string) => {
    dispatch({ type: 'DELETE_CHECKLIST', payload: { cardId: card.id, checklistId } })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      dispatch({ type: 'ADD_COMMENT', payload: { cardId: card.id, text: newComment.trim() } })
      setNewComment('')
    }
  }

  const handleArchive = () => {
    dispatch({ type: 'ARCHIVE_CARD', payload: card.id })
    onClose()
  }

  const handleDelete = () => {
    dispatch({ type: 'DELETE_CARD', payload: card.id })
    onClose()
  }

  const getChecklistProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0
    return (checklist.items.filter((i) => i.completed).length / checklist.items.length) * 100
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {currentCard.coverImage && (
          <div className="h-32 relative">
            <img
              src={currentCard.coverImage}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-2 right-2 opacity-80"
              onClick={() => dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, coverImage: null } })}
            >
              Remove cover
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="p-6">
            <DialogHeader className="space-y-0 mb-6">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  {editingTitle ? (
                    <Input
                      ref={titleInputRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle()
                        if (e.key === 'Escape') {
                          setTitle(currentCard.title)
                          setEditingTitle(false)
                        }
                      }}
                      className="text-xl font-semibold -ml-3 -mt-1"
                    />
                  ) : (
                    <DialogTitle
                      className="text-xl font-semibold cursor-pointer hover:bg-muted/50 px-2 py-1 -ml-2 rounded"
                      onClick={() => setEditingTitle(true)}
                    >
                      {currentCard.title}
                    </DialogTitle>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    in list <span className="font-medium underline">{currentList?.title}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
              <div className="space-y-6">
                {(cardLabels.length > 0 || cardMembers.length > 0 || currentCard.dueDate) && (
                  <div className="flex flex-wrap gap-4">
                    {cardMembers.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Members</p>
                        <div className="flex -space-x-1">
                          {cardMembers.map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    )}

                    {cardLabels.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Labels</p>
                        <div className="flex flex-wrap gap-1">
                          {cardLabels.map((label) => (
                            <Badge
                              key={label.id}
                              style={{ backgroundColor: label.color }}
                              className="text-white"
                            >
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentCard.dueDate && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Due date</p>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(currentCard.dueDate), 'MMM d, yyyy')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlignLeft className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium">Description</h3>
                  </div>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a more detailed description..."
                        className="min-h-[100px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveDescription}>
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDescription(currentCard.description)
                            setEditingDescription(false)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingDescription(true)}
                      className="w-full text-left p-3 bg-muted/50 rounded-md text-sm hover:bg-muted transition-colors"
                    >
                      {currentCard.description || 'Add a more detailed description...'}
                    </button>
                  )}
                </div>

                {currentCard.checklists.map((checklist) => (
                  <div key={checklist.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-medium">{checklist.title}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChecklist(checklist.id)}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>{Math.round(getChecklistProgress(checklist))}%</span>
                      </div>
                      <Progress value={getChecklistProgress(checklist)} className="h-2" />
                    </div>

                    <div className="space-y-1">
                      {checklist.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded group"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) =>
                              handleToggleChecklistItem(checklist.id, item.id, checked as boolean)
                            }
                          />
                          <span
                            className={`flex-1 text-sm ${
                              item.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              dispatch({
                                type: 'DELETE_CHECKLIST_ITEM',
                                payload: { cardId: card.id, checklistId: checklist.id, itemId: item.id },
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {addingItemTo === checklist.id ? (
                      <div className="mt-2 space-y-2">
                        <Input
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="Add an item"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddChecklistItem(checklist.id)
                            if (e.key === 'Escape') {
                              setNewItemText('')
                              setAddingItemTo(null)
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAddChecklistItem(checklist.id)}>
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewItemText('')
                              setAddingItemTo(null)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setAddingItemTo(checklist.id)}
                      >
                        Add an item
                      </Button>
                    )}
                  </div>
                ))}

                {currentCard.attachments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">Attachments</h3>
                    </div>
                    <div className="space-y-2">
                      {currentCard.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-md group"
                        >
                          <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                            <Paperclip className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {formatDistanceToNow(new Date(attachment.addedAt))} ago
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              dispatch({
                                type: 'DELETE_ATTACHMENT',
                                payload: { cardId: card.id, attachmentId: attachment.id },
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">Activity</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActivity(!showActivity)}
                    >
                      {showActivity ? 'Hide details' : 'Show details'}
                    </Button>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={state.currentUser.avatar} />
                      <AvatarFallback className="text-xs">
                        {state.currentUser.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[60px] resize-none"
                      />
                      {newComment && (
                        <Button size="sm" className="mt-2" onClick={handleAddComment}>
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentCard.comments.map((comment) => {
                      const member = state.members.find((m) => m.id === comment.memberId)
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member?.avatar} />
                            <AvatarFallback className="text-xs">
                              {member?.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{member?.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt))} ago
                              </span>
                            </div>
                            <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{comment.text}</p>
                          </div>
                        </div>
                      )
                    })}

                    {showActivity &&
                      currentCard.activities.map((activity) => {
                        const member = state.members.find((m) => m.id === activity.memberId)
                        return (
                          <div key={activity.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback className="text-xs">
                                {member?.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{member?.name}</span>{' '}
                              <span className="text-muted-foreground">{activity.action}</span>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.createdAt))} ago
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Add to card</p>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Members
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <p className="text-sm font-medium mb-2 px-2">Members</p>
                    <div className="space-y-1">
                      {state.members.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleToggleMember(member.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left ${
                            currentCard.members.includes(member.id) ? 'bg-muted' : ''
                          }`}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-[10px]">
                              {member.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                          {currentCard.members.includes(member.id) && (
                            <CheckSquare className="h-4 w-4 ml-auto text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Tag className="h-4 w-4 mr-2" />
                      Labels
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <p className="text-sm font-medium mb-2 px-2">Labels</p>
                    <div className="space-y-1">
                      {state.labels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left ${
                            currentCard.labels.includes(label.id) ? 'bg-muted' : ''
                          }`}
                        >
                          <span
                            className="h-6 flex-1 rounded text-white text-sm font-medium px-2 flex items-center"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                          {currentCard.labels.includes(label.id) && (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={currentCard.dueDate ? new Date(currentCard.dueDate) : undefined}
                      onSelect={handleSetDueDate}
                      initialFocus
                    />
                    {currentCard.dueDate && (
                      <div className="p-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive"
                          onClick={() => handleSetDueDate(undefined)}
                        >
                          Remove due date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {addingChecklist ? (
                  <div className="space-y-2 p-2 bg-muted rounded">
                    <Input
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      placeholder="Checklist title"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddChecklist()
                        if (e.key === 'Escape') {
                          setNewChecklistTitle('')
                          setAddingChecklist(false)
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddChecklist}>
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewChecklistTitle('')
                          setAddingChecklist(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setAddingChecklist(true)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Checklist
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    dispatch({
                      type: 'ADD_ATTACHMENT',
                      payload: {
                        cardId: card.id,
                        attachment: {
                          name: `Document-${Date.now()}.pdf`,
                          url: '#',
                          type: 'application/pdf',
                          addedBy: state.currentUser.id,
                        },
                      },
                    })
                  }}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachment
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const coverImages = [
                      'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop',
                      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=200&fit=crop',
                      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=200&fit=crop',
                    ]
                    const randomCover = coverImages[Math.floor(Math.random() * coverImages.length)]
                    dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, coverImage: randomCover } })
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Cover
                </Button>

                <Separator className="my-3" />

                <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleArchive}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

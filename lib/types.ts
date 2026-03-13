// lib/types.ts

export interface Member {
  id: string
  name: string
  avatar: string | null     // <-- Added | null to match Prisma
  email: string
  boardId?: string | null   // <-- Added to match Prisma
}

export interface Label {
  id: string
  name: string
  color: string
  boardId?: string          // <-- Added to match Prisma
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface Comment {
  id: string
  memberId: string
  text: string
  createdAt: Date
}

export interface Activity {
  id: string
  memberId: string
  action: string
  createdAt: Date
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  addedAt: Date
  addedBy: string
}

export interface Card {
  id: string
  title: string
  description: string | null
  listId: string
  position?: number // Made flexible
  order?: number    // Matches Prisma
  labels: string[]
  members: string[]
  dueDate: Date | null
  coverImage: string | null
  checklists: Checklist[]
  comments: Comment[]
  activities: Activity[]
  attachments: Attachment[]
  archived: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface List {
  id: string
  title: string
  boardId: string
  position?: number // Made flexible
  order?: number    // Matches Prisma
  color?: string | null
  cards: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Board {
  id: string
  title: string
  background: string
  lists: string[]
}

export interface BoardState {
  board: Board
  lists: Record<string, List>
  cards: Record<string, Card>
  members: Member[]
  labels: Label[]
  currentUser: Member
  searchQuery: string
  filterLabels: string[]
  filterMembers: string[]
  filterDueDate: 'all' | 'overdue' | 'dueToday' | 'dueThisWeek' | 'noDueDate'
}
// lib/types.ts

export interface BoardState {
  board: Board
  lists: Record<string, List>
  cards: Record<string, Card>
  members: Member[]
  labels: Label[]
  currentUser: Member
  searchQuery: string
  filterLabels: string[]
  filterMembers: string[]
  filterDueDate: 'all' | 'overdue' | 'dueToday' | 'dueThisWeek' | 'noDueDate'
  
  // ADD THIS LINE:
  availableBoards?: { id: string; title: string }[] 
}
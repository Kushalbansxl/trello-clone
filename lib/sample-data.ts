import type { BoardState, Member, Label, Card, List, Board } from './types'

export const sampleMembers: Member[] = [
  {
    id: 'member-1',
    name: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    email: 'alex@example.com',
  },
  {
    id: 'member-2',
    name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    email: 'sarah@example.com',
  },
  {
    id: 'member-3',
    name: 'Mike Peters',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    email: 'mike@example.com',
  },
  {
    id: 'member-4',
    name: 'Emily Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    email: 'emily@example.com',
  },
]

export const sampleLabels: Label[] = [
  { id: 'label-1', name: 'Priority', color: '#ef4444' },
  { id: 'label-2', name: 'Design', color: '#f97316' },
  { id: 'label-3', name: 'Development', color: '#eab308' },
  { id: 'label-4', name: 'Bug', color: '#22c55e' },
  { id: 'label-5', name: 'Feature', color: '#3b82f6' },
  { id: 'label-6', name: 'Documentation', color: '#8b5cf6' },
]

const now = new Date()
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

export const sampleCards: Record<string, Card> = {
  'card-1': {
    id: 'card-1',
    title: 'Project kickoff meeting',
    description: 'Schedule and prepare for the initial project kickoff meeting with all stakeholders.',
    listId: 'list-1',
    position: 0,
    labels: ['label-1', 'label-5'],
    members: ['member-1', 'member-2'],
    dueDate: tomorrow,
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
    checklists: [
      {
        id: 'checklist-1',
        title: 'Preparation',
        items: [
          { id: 'item-1', text: 'Create agenda', completed: true },
          { id: 'item-2', text: 'Send invites', completed: true },
          { id: 'item-3', text: 'Prepare slides', completed: false },
          { id: 'item-4', text: 'Book meeting room', completed: false },
        ],
      },
    ],
    comments: [
      {
        id: 'comment-1',
        memberId: 'member-2',
        text: 'I\'ve sent out the calendar invites to everyone.',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
    activities: [
      {
        id: 'activity-1',
        memberId: 'member-1',
        action: 'created this card',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  },
  'card-2': {
    id: 'card-2',
    title: 'Design system review',
    description: 'Review and update the design system components.',
    listId: 'list-1',
    position: 1,
    labels: ['label-2'],
    members: ['member-3'],
    dueDate: null,
    coverImage: null,
    checklists: [],
    comments: [],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
  },
  'card-3': {
    id: 'card-3',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment pipelines for the project.',
    listId: 'list-2',
    position: 0,
    labels: ['label-3', 'label-5'],
    members: ['member-1'],
    dueDate: yesterday,
    coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=200&fit=crop',
    checklists: [
      {
        id: 'checklist-2',
        title: 'Pipeline Setup',
        items: [
          { id: 'item-5', text: 'Configure build step', completed: true },
          { id: 'item-6', text: 'Add unit tests', completed: true },
          { id: 'item-7', text: 'Setup staging deploy', completed: true },
          { id: 'item-8', text: 'Setup production deploy', completed: false },
        ],
      },
    ],
    comments: [],
    activities: [],
    attachments: [
      {
        id: 'attachment-1',
        name: 'pipeline-diagram.pdf',
        url: '#',
        type: 'application/pdf',
        addedAt: now,
        addedBy: 'member-1',
      },
    ],
    archived: false,
    createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
  },
  'card-4': {
    id: 'card-4',
    title: 'User authentication flow',
    description: 'Implement secure user authentication with OAuth2.',
    listId: 'list-2',
    position: 1,
    labels: ['label-3', 'label-1'],
    members: ['member-2', 'member-4'],
    dueDate: nextWeek,
    coverImage: null,
    checklists: [],
    comments: [],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 96 * 60 * 60 * 1000),
  },
  'card-5': {
    id: 'card-5',
    title: 'Fix navigation bug',
    description: 'The mobile navigation menu doesn\'t close properly on route change.',
    listId: 'list-2',
    position: 2,
    labels: ['label-4'],
    members: ['member-3'],
    dueDate: null,
    coverImage: null,
    checklists: [],
    comments: [
      {
        id: 'comment-2',
        memberId: 'member-3',
        text: 'Found the issue - it\'s a state management problem.',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      },
    ],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
  },
  'card-6': {
    id: 'card-6',
    title: 'API documentation',
    description: 'Write comprehensive API documentation using OpenAPI spec.',
    listId: 'list-3',
    position: 0,
    labels: ['label-6'],
    members: ['member-4'],
    dueDate: tomorrow,
    coverImage: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=200&fit=crop',
    checklists: [
      {
        id: 'checklist-3',
        title: 'Documentation sections',
        items: [
          { id: 'item-9', text: 'Authentication endpoints', completed: true },
          { id: 'item-10', text: 'User endpoints', completed: true },
          { id: 'item-11', text: 'Product endpoints', completed: false },
          { id: 'item-12', text: 'Order endpoints', completed: false },
        ],
      },
    ],
    comments: [],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 120 * 60 * 60 * 1000),
  },
  'card-7': {
    id: 'card-7',
    title: 'Performance optimization',
    description: 'Optimize bundle size and implement lazy loading.',
    listId: 'list-3',
    position: 1,
    labels: ['label-3', 'label-5'],
    members: ['member-1', 'member-2'],
    dueDate: null,
    coverImage: null,
    checklists: [],
    comments: [],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 144 * 60 * 60 * 1000),
  },
  'card-8': {
    id: 'card-8',
    title: 'Launch landing page',
    description: 'Deploy the new marketing landing page to production.',
    listId: 'list-4',
    position: 0,
    labels: ['label-2', 'label-5'],
    members: ['member-1', 'member-3', 'member-4'],
    dueDate: null,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
    checklists: [
      {
        id: 'checklist-4',
        title: 'Launch checklist',
        items: [
          { id: 'item-13', text: 'Final QA review', completed: true },
          { id: 'item-14', text: 'SEO optimization', completed: true },
          { id: 'item-15', text: 'Analytics setup', completed: true },
          { id: 'item-16', text: 'Deploy to production', completed: true },
        ],
      },
    ],
    comments: [
      {
        id: 'comment-3',
        memberId: 'member-1',
        text: 'Great work everyone! The page looks amazing.',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
    activities: [],
    attachments: [],
    archived: false,
    createdAt: new Date(now.getTime() - 168 * 60 * 60 * 1000),
  },
}

export const sampleLists: Record<string, List> = {
  'list-1': {
    id: 'list-1',
    title: 'Backlog',
    boardId: 'board-1',
    position: 0,
    cards: ['card-1', 'card-2'],
  },
  'list-2': {
    id: 'list-2',
    title: 'In Progress',
    boardId: 'board-1',
    position: 1,
    cards: ['card-3', 'card-4', 'card-5'],
  },
  'list-3': {
    id: 'list-3',
    title: 'In Review',
    boardId: 'board-1',
    position: 2,
    cards: ['card-6', 'card-7'],
  },
  'list-4': {
    id: 'list-4',
    title: 'Completed',
    boardId: 'board-1',
    position: 3,
    cards: ['card-8'],
  },
}

export const sampleBoard: Board = {
  id: 'board-1',
  title: 'Project Alpha',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  lists: ['list-1', 'list-2', 'list-3', 'list-4'],
}

export const initialBoardState: BoardState = {
  board: sampleBoard,
  lists: sampleLists,
  cards: sampleCards,
  members: sampleMembers,
  labels: sampleLabels,
  currentUser: sampleMembers[0],
  searchQuery: '',
  filterLabels: [],
  filterMembers: [],
  filterDueDate: 'all',
}

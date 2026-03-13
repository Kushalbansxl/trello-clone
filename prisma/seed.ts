// prisma/seed.ts
import prisma from "../lib/prisma"

async function main() {
  console.log('Clearing existing data...')
  await prisma.card.deleteMany()
  await prisma.list.deleteMany()
  await prisma.board.deleteMany()

  console.log('Seeding data...')

  // 1. Create the Board
  const board = await prisma.board.create({
    data: {
      id: 'board-1', // Match your sample-data.ts ID
      title: 'Project Alpha',
    },
  })

  // 2. Create the Lists
  const listData = [
    { id: 'list-1', title: 'Backlog', order: 0 },
    { id: 'list-2', title: 'In Progress', order: 1 },
    { id: 'list-3', title: 'In Review', order: 2 },
    { id: 'list-4', title: 'Completed', order: 3 },
  ]

  for (const list of listData) {
    await prisma.list.create({
      data: {
        id: list.id,
        title: list.title,
        order: list.order,
        boardId: board.id,
      },
    })
  }

  // 3. Create Sample Cards
  await prisma.card.createMany({
    data: [
      { 
        id: 'card-1', 
        title: 'Project kickoff meeting', 
        description: 'Schedule and prepare for the initial project kickoff meeting.', 
        order: 0, 
        listId: 'list-1' 
      },
      { 
        id: 'card-2', 
        title: 'Design system review', 
        description: 'Review and update the design system components.', 
        order: 1, 
        listId: 'list-1' 
      },
      { 
        id: 'card-3', 
        title: 'Setup CI/CD pipeline', 
        description: 'Configure automated testing and deployment.', 
        order: 0, 
        listId: 'list-2' 
      },
    ],
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
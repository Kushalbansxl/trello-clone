"use server"

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

// 1. Fetch Boards
export async function getBoards() {
  noStore();
  try {
    return await prisma.board.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        labels: true,  // Fetch board labels
        members: true, // Fetch board members
        lists: {
          orderBy: { order: 'asc' }, 
          include: { 
            cards: { 
              orderBy: { order: 'asc' },
              include: {
                labels: true,
                members: true,
                checklists: {
                  include: { items: true } // Fetch nested items
                }
              }
            } 
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    return [];
  }
}

// --- UPDATE BOARD BACKGROUND ---
export async function updateBoardBackground(boardId: string, background: string) {
  try {
    await prisma.board.update({
      where: { id: boardId },
      data: { background }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to update board background:", error);
    return { success: false };
  }
}

// 2. Create a new list
export async function createList(boardId: string, title: string, order: number) {
  try {
    const newList = await prisma.list.create({
      data: { title, boardId, order },
    });
    revalidatePath("/");
    return { success: true, list: newList };
  } catch (error) {
    return { success: false };
  }
}

// 3. Create a new card (THIS WAS MISSING!)
export async function createCard(listId: string, title: string, order: number) {
  try {
    const newCard = await prisma.card.create({
      data: { title, listId, order },
    });
    revalidatePath("/");
    return { success: true, card: newCard };
  } catch (error) {
    console.error("Failed to create card:", error);
    return { success: false };
  }
}

// 4. Bulk Update List Order
export async function updateListOrder(updates: { id: string; order: number }[]) {
  try {
    await prisma.$transaction(
      updates.map((list) =>
        prisma.list.update({ where: { id: list.id }, data: { order: list.order } })
      )
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 5. Bulk Update Card Order
export async function updateCardOrder(updates: { id: string; order: number; listId: string }[]) {
  try {
    await prisma.$transaction(
      updates.map((card) =>
        prisma.card.update({
          where: { id: card.id },
          data: { order: card.order, listId: card.listId },
        })
      )
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 6. Update List Color
export async function updateListColor(listId: string, color: string | null) {
  try {
    // @ts-ignore
    await prisma.list.update({ where: { id: listId }, data: { color } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// 7. Update Card Cover
export async function updateCardCover(cardId: string, coverImage: string | null) {
  try {
    // @ts-ignore
    await prisma.card.update({ where: { id: cardId }, data: { coverImage } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
// actions/board.ts

// 8. Create a new Board
export async function createBoard(title: string, background?: string) {
  try {
    const newBoard = await prisma.board.create({
      data: {
        title,
        background: background || 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
      }
    });
    revalidatePath("/");
    return { success: true, board: newBoard };
  } catch (error) {
    console.error("Failed to create board:", error);
    return { success: false };
  }
}
// --- LABELS ---
export async function toggleCardLabel(cardId: string, labelId: string, hasLabel: boolean) {
  try {
    if (hasLabel) {
      // Disconnect
      await prisma.card.update({
        where: { id: cardId },
        data: { labels: { disconnect: { id: labelId } } }
      })
    } else {
      // Connect
      await prisma.card.update({
        where: { id: cardId },
        data: { labels: { connect: { id: labelId } } }
      })
    }
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- MEMBERS ---
export async function toggleCardMember(cardId: string, memberId: string, hasMember: boolean) {
  try {
    if (hasMember) {
      await prisma.card.update({
        where: { id: cardId },
        data: { members: { disconnect: { id: memberId } } }
      })
    } else {
      await prisma.card.update({
        where: { id: cardId },
        data: { members: { connect: { id: memberId } } }
      })
    }
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- DUE DATE ---
export async function updateCardDueDate(cardId: string, dueDate: Date | null) {
  try {
    await prisma.card.update({
      where: { id: cardId },
      data: { dueDate }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- CHECKLISTS ---
export async function addChecklist(cardId: string, title: string) {
  try {
    const checklist = await prisma.checklist.create({
      data: { title, cardId }
    })
    revalidatePath('/')
    return { success: true, checklist }
  } catch (error) {
    return { success: false }
  }
}

export async function addChecklistItem(checklistId: string, text: string) {
  try {
    const item = await prisma.checklistItem.create({
      data: { text, checklistId }
    })
    revalidatePath('/')
    return { success: true, item }
  } catch (error) {
    return { success: false }
  }
}

export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { isCompleted }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- CARD DESCRIPTION ---
export async function updateCardDescription(cardId: string, description: string | null) {
  try {
    await prisma.card.update({
      where: { id: cardId },
      data: { description }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- DELETE CHECKLIST ---
export async function deleteChecklist(checklistId: string) {
  try {
    await prisma.checklist.delete({
      where: { id: checklistId }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- DELETE CARD ---
export async function deleteCard(cardId: string) {
  try {
    await prisma.card.delete({
      where: { id: cardId }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- DELETE LIST ---
export async function deleteList(listId: string) {
  try {
    // Note: Prisma schema mein 'Cascade' delete on hai, 
    // toh list delete hone par uske andar ke saare cards automatically delete ho jayenge!
    await prisma.list.delete({
      where: { id: listId }
    })
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

// --- DELETE BOARD ---
export async function deleteBoard(boardId: string) {
  try {
    await prisma.board.delete({
      where: { id: boardId }
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete board:", error);
    return { success: false };
  }
}
// --- 🔥 ADD MEMBER BY NAME 🔥 ---
export async function addMemberByName(boardId: string, name: string) {
  try {
    // Database schema satisfy karne ke liye ek random dummy email generate
    const dummyEmail = `${name.replace(/\s+/g, '').toLowerCase()}-${Date.now()}@board.local`;
    const member = await prisma.member.create({
      data: { 
        email: dummyEmail, 
        name, 
        boardId, 
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}` 
      }
    });
    revalidatePath('/');
    return { success: true, member };
  } catch (error) { 
    console.error("Failed to add member:", error);
    return { success: false }; 
  }
}

// --- 🔥 CREATE NEW LABEL 🔥 ---
export async function createLabel(boardId: string, name: string, color: string) {
  try {
    const label = await prisma.label.create({ 
      data: { name, color, boardId } 
    });
    revalidatePath('/');
    return { success: true, label };
  } catch (error) {
    console.error("Failed to create label:", error);
    return { success: false };
  }
}
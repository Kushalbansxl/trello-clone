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
        lists: {
          orderBy: { order: 'asc' }, 
          include: { cards: { orderBy: { order: 'asc' } } },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    return [];
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
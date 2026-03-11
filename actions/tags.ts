"use server";

import prisma from "@/lib/prisma";

export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      take: 6,
      select: {
        name: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: tags.map((t) => t.name),
    };
  } catch (error) {
    console.error("Error fetching recent tags:", error);
    return {
      success: false,
      message: "An error occurred while fetching tags",
      data: [],
    };
  }
}

export async function checkTagExists(query: string) {
  if (!query || query.length < 2) return { success: true, exists: false };
  
  try {
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: query.trim(),
          mode: 'insensitive' 
        }
      }
    });

    return { success: true, exists: !!existingTag };
  } catch (error) {
    return { success: false, exists: false };
  }
}
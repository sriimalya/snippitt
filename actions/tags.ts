"use server";

import prisma from "@/lib/prisma";

export async function getTags() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: tags.map((t) => t.name),
    };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return {
      success: false,
      message: "An error occurred while fetching tags",
      data: [],
    };
  }
}

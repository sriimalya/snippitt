"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function toggleLike(postId: string) {
  try {
    const user = await getSession();
    if (!user?.id) {
      return {
        success: false,
        code: "UNAUTHORIZED",
        message: "User not logged in",
      };
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId,
          },
        },
      });
      return { success: true, liked: false, message: "Like removed" };
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId,
        },
      });
      return { success: true, liked: true, message: "Post liked" };
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error toggling like",
      code: "TOGGLE_FAILED",
    };
  }
}

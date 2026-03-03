"use server";
import { getSession } from "@/lib/auth";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import prisma from "@/lib/prisma";
//Can modify it to accept userId also so that it works faster
export async function savePost(postId: string) {
  const session = await getSession();

  if (!session?.id) {
    return {
      success: false,
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  }

  if (!postId || typeof postId !== "string") {
    return {
      success: false,
      error: {
        message: "Invalid post ID",
        code: "INVALID_INPUT",
      },
    };
  }

  try {
    await prisma.savedPost.create({
      data: {
        userId: session.id,
        postId,
      },
    });

    return {
      success: true,
      message: "Post saved successfully",
      code: "SUCCESS",
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: {
          message: "Post already saved",
          code: "ALREADY_SAVED",
        },
      };
    }

    console.error("savePost error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}
//Just check it
export async function unsavePost(postId: string) {
  const session = await getSession();

  if (!session?.id) {
    return {
      success: false,
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  }

  if (!postId || typeof postId !== "string") {
    return {
      success: false,
      error: {
        message: "Invalid post ID",
        code: "INVALID_INPUT",
      },
    };
  }

  try {
    const deleted = await prisma.savedPost.deleteMany({
      where: {
        userId: session.id,
        postId,
      },
    });

    if (deleted.count === 0) {
      return {
        success: false,
        error: {
          message: "Post was not saved",
          code: "NOT_SAVED",
        },
      };
    }

    return {
      success: true,
      message: "Post removed from saved",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("unsavePost error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createComment(postId: string, commentText: string) {
  try {
    // 1. Input validation
    if (!postId || typeof postId !== "string") {
      return {
        success: false,
        error: "Invalid post ID",
        code: "INVALID_POST_ID",
      };
    }

    if (!commentText?.trim() || commentText.length > 500) {
      return {
        success: false,
        error: "Comment text is required and must be less than 500 characters",
        code: "INVALID_COMMENT_TEXT",
      };
    }

    // 2. Auth check
    const user = await getSession();
    if (!user?.id) {
      return {
        success: false,
        error: "User not authenticated",
        code: "UNAUTHORIZED",
      };
    }

    // 3. Database operation
    const comment = await prisma.comment.create({
      data: {
        postId,
        content: commentText.trim(),
        userId: user.id,
      },
    });

    return {
      success: true,
      message: "Comment created successfully",
      data: comment,
    };
  } catch (error) {
    console.error("Comment creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Operation failed",
      code: "SERVER_ERROR",
    };
  }
}

//For Getting All the Commnets of a Single Post
export async function getCommentsByPostId(postId: string) {
  try {

    //Check Auth
    const user = await getSession();
    if (!user) {
      return {
        success: false,
        message: "User not authenticated",
        code: "UNAUTHORIZED",
      };
    }
    // Validate postId
    if (!postId || typeof postId !== "string") {
      return {
        success: false,
        message: "Invalid post ID",
        code: "INVALID_POST_ID",
      };
    }

    // Fetch comments from the database
    const comments = await prisma.comment.findMany({
      where: { postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        post:{
            select:{
                userId: true,
            }
        },
        user: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (comments.length === 0) {
      return {
        success: false,
        message: "No comments found for this post",
        code: "NO_COMMENTS",
      };
    }

    return {
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return {
      success: false,
      message: "An error occurred while fetching comments",
      code: "FETCH_FAILED",
    };
  }
}

//For Deleting Your Own Comment
export async function deleteMyComment(commentId: string) {
  try {
    // Validate commentId
    if (!commentId || typeof commentId !== "string") {
      return {
        success: false,
        message: "Invalid comment ID",
        code: "INVALID_COMMENT_ID",
      };
    }

    // Get the current user session
    const user = await getSession();
    if (!user) {
      return {
        success: false,
        message: "User not authenticated",
        code: "UNAUTHORIZED",
      };
    }

    // Check if the comment exists and belongs to the user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, userId: user.id },
    });

    if (!comment) {
      return {
        success: false,
        message: "Comment not found or does not belong to the you",
        code: "COMMENT_NOT_FOUND",
      };
    }

    // Delete the comment
    await prisma.comment.delete({ where: { id: commentId } });

    return {
      success: true,
      message: "Comment deleted successfully",
      data: {
        id: commentId,
      },
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      message: "An error occurred while deleting the comment",
      code: "DELETE_FAILED",
    };
  }
}

//For Deleting Any Comment as Owner of the Post
export async function deleteCommentByPostOwner(
  commentId: string,
  postId: string
) {
  try {
    // 1. Input validation
    if (!commentId || !postId) {
      return {
        success: false,
        message: "Both commentId and postId are required",
        code: "INVALID_INPUT",
      };
    }

    // 2. Authentication check
    const user = await getSession();
    if (!user?.id) {
      return {
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    // 3. Combined verification in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify post ownership and comment existence simultaneously
      const post = await tx.post.findFirst({
        where: {
          id: postId,
          userId: user.id, // Ensures requester owns the post
          comments: {
            some: { id: commentId }, // Ensures comment belongs to post
          },
        },
        select: { id: true },
      });

      if (!post) {
        return {
          success: false,
          message: "Post not found or you do not own this post",
          code: "POST_NOT_FOUND_OR_UNAUTHORIZED",
        };
      }

      // Delete the comment
      return await tx.comment.delete({
        where: { id: commentId },
        select: { id: true },
      });
    });

    return {
      success: true,
      message: "Comment deleted successfully",
      data: result,
    };
  } catch (error) {
    console.error("Delete comment error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Deletion failed",
      code: "DELETE_FAILED",
    };
  }
}

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
interface GetSavedPostsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getSavedPosts({
  page = 1,
  limit = 10,
  search = "",
}: GetSavedPostsParams) {
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

  try {
    const skip = (page - 1) * limit;

    const [total, savedPosts] = await Promise.all([
      prisma.savedPost.count({
        where: {
          userId: session.id,
          post: {
            ...(search.trim() && {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }),
          },
        },
      }),
      prisma.savedPost.findMany({
        where: {
          userId: session.id,
          post: {
            ...(search.trim() && {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }),
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              images: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const visiblePosts = savedPosts
      .map(({ post }) => post)
      .filter((post) => {
        if (post.visibility === "PUBLIC") return true;
        if (post.userId === session.id) return true;
        // Add additional visibility checks if needed
        return false;
      });
    for (const post of visiblePosts) {
      // Sign coverImage if it exists
      if (post.coverImage) {
        const key = extractKeyFromUrl(post.coverImage);
        post.coverImage = await generatePresignedViewUrl(key);
      }

      // Sign each image URL
      post.images = await Promise.all(
        post.images.map(async (image) => {
          const key = extractKeyFromUrl(image.url);
          const signedUrl = await generatePresignedViewUrl(key);
          return {
            ...image,
            url: signedUrl,
          };
        }),
      );

      // Optionally: sign user.avatar
      if (post.user?.avatar) {
        const key = extractKeyFromUrl(post.user.avatar);
        post.user.avatar = await generatePresignedViewUrl(key);
      }
    }

    return {
      success: true,
      data: {
        posts: visiblePosts.map((post) => ({
          ...post,
          isSaved: true, // Since these are saved posts
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("getSavedPosts error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

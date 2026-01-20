"use server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  extractKeyFromUrl,
  changeFileVisibility,
  generatePresignedViewUrl,
} from "@/lib/aws_s3";
import { Visibility } from "@/schemas/post";
//Server Action for Creating a Collection , the User will always be the logged in User
export async function createCollection(name: string) {
  const session = await getSession();
  if (!session?.id)
    return {
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    };

  try {
    const existing = await prisma.collection.findFirst({
      where: {
        userId: session.id,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing)
      return {
        success: false,
        error: { message: "Name already exists", code: "DUPLICATE" },
      };

    const newCol = await prisma.collection.create({
      data: { name, userId: session.id },
    });

    return { success: true, data: newCol };
  } catch (error) {
    return {
      success: false,
      error: { message: "Failed to create", code: "SERVER_ERROR" },
    };
  }
}

export async function addNewPostToCollection(
  collectionId: string,
  postId: string,
) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    // 1. Check if the post is already in this specific collection
    const existing = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.id,
        posts: { some: { id: postId } },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: "Post is already in this collection",
          code: "ALREADY_EXISTS",
        },
      };
    }

    // 2. Perform the connection
    await prisma.collection.update({
      where: { id: collectionId, userId: session.id },
      data: {
        posts: {
          connect: { id: postId },
        },
      },
    });

    return { success: true, message: "Added to collection" };
  } catch (error) {
    console.error("Add to collection error:", error);
    return {
      success: false,
      error: { message: "Failed to add post", code: "SERVER_ERROR" },
    };
  }
}

export async function removePostFromCollection(
  collectionId: string,
  postId: string,
) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    // 1. Check if the post actually exists in the collection first
    const existing = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.id,
        posts: { some: { id: postId } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: {
          message: "Post not found in this collection",
          code: "NOT_FOUND",
        },
      };
    }

    // 2. Perform the disconnection
    await prisma.collection.update({
      where: { id: collectionId, userId: session.id },
      data: {
        posts: {
          disconnect: { id: postId },
        },
      },
    });

    return { success: true, message: "Removed from collection" };
  } catch (error) {
    console.error("Remove from collection error:", error);
    return {
      success: false,
      error: { message: "Failed to remove post", code: "SERVER_ERROR" },
    };
  }
}
//Fetching all Collections of the User
//Add that preSigned URL for the cover image if it exists
export async function getUserCollectionNames(postId: string) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    const collections = await prisma.collection.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        // ✅ Check if this specific post exists in the collection
        posts: {
          where: { id: postId },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to include a simple boolean
    const data = collections.map((col) => ({
      id: col.id,
      name: col.name,
      hasPost: col.posts.length > 0,
    }));

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: { message: "Failed to fetch collections" },
    };
  }
}
// ==================================Correct Above it======================
// Fetching a single collection by ID
export async function getCollectionById(collectionId: string) {
  const session = await getSession();
  if (!session?.id) {
    return {
      success: false,
      error: { message: "Unauthorized access", code: "UNAUTHORIZED" },
    };
  }

  try {
    // ✅ OPTIMIZED: Single query with proper access control
    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        // Collection visibility check in single query
        OR: [
          { userId: session.id }, // Owner sees all (including drafts)
          {
            isDraft: false, // Non-owners only see non-drafts
            OR: [
              { visibility: "PUBLIC" },
              {
                visibility: "FOLLOWERS",
                user: {
                  followers: { some: { followerId: session.id } },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        visibility: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        posts: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            visibility: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            category: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return {
        success: false,
        error: {
          message: "Collection not found or access denied",
          code: "NOT_FOUND",
        },
      };
    }

    const isOwner = collection.userId === session.id;

    // ✅ EFFICIENT: Get unique post owners for follow checks
    const postOwners = new Set<string>();
    collection.posts.forEach((post) => {
      if (post.userId !== session.id) {
        postOwners.add(post.userId);
      }
    });

    // ✅ SINGLE QUERY: Follow status for all post owners
    let followingIds: Set<string> = new Set();
    if (postOwners.size > 0) {
      const following = await prisma.follow.findMany({
        where: {
          followerId: session.id,
          followingId: { in: Array.from(postOwners) },
        },
        select: { followingId: true },
      });
      followingIds = new Set(following.map((f) => f.followingId));
    }

    // ✅ PRE-FILTER: Get visible post IDs for single saved posts query
    const visiblePosts = collection.posts.filter((post) => {
      const isPostOwner = post.userId === session.id;
      return (
        isPostOwner ||
        post.visibility === "PUBLIC" ||
        (post.visibility === "FOLLOWERS" && followingIds.has(post.userId))
      );
    });

    const visiblePostIds = visiblePosts.map((post) => post.id);

    // ✅ SINGLE QUERY: Saved status for all visible posts
    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId: session.id,
        postId: { in: visiblePostIds },
      },
      select: { postId: true },
    });
    const savedPostIds = new Set(savedPosts.map((p) => p.postId));

    // ✅ PROCESS: All visible posts with signed URLs
    const processedPosts = await Promise.all(
      visiblePosts.map(async (post) => {
        const [signedCoverImage, signedAvatar] = await Promise.all([
          post.coverImage
            ? generatePresignedViewUrl(extractKeyFromUrl(post.coverImage))
            : null,
          post.user.avatar
            ? generatePresignedViewUrl(extractKeyFromUrl(post.user.avatar))
            : null,
        ]);

        return {
          ...post,
          coverImage: signedCoverImage,
          isSaved: savedPostIds.has(post.id),
          user: {
            ...post.user,
            avatar: signedAvatar,
          },
        };
      }),
    );

    const signedCollectionCover = collection.coverImage
      ? await generatePresignedViewUrl(extractKeyFromUrl(collection.coverImage))
      : null;

    return {
      success: true,
      data: {
        ...collection,
        coverImage: signedCollectionCover,
        posts: processedPosts,
        isOwner, // ✅ Now actually used and returned
      },
      message: "Collection fetched successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("getCollectionById error:", error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}
//Fetch You Collection Names, i.e. including Drafts Collection so that User Can select them and then add to that particular collection

//Server Action for Getting my Own Collection(a single one for allowing updates)
export async function getMyCollectionById(collectionId: string) {
  const session = await getSession();
  if (!session?.id) {
    // ✅ FIX 1: Check session.id
    return {
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    };
  }

  try {
    if (!collectionId || typeof collectionId !== "string") {
      return {
        success: false,
        error: { message: "Invalid collection ID", code: "INVALID_INPUT" },
      };
    }

    // ✅ FIX 2: Fetch collection with ownership check
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
        userId: session.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        visibility: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        posts: {
          where: { isDraft: false }, // Only non-draft posts
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            visibility: true,
            userId: true, // ✅ NEEDED for access checks
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!collection) {
      return {
        success: false,
        error: {
          message: "Collection not found or access denied",
          code: "NOT_FOUND",
        },
      };
    }

    // ✅ FIX 3: Filter posts by visibility/access
    const postOwners = new Set<string>();
    collection.posts.forEach((post) => {
      if (post.userId !== session.id) {
        postOwners.add(post.userId);
      }
    });

    // ✅ FIX 4: Check follow relationships for follower-only posts
    let followingIds: Set<string> = new Set();
    if (postOwners.size > 0) {
      const following = await prisma.follow.findMany({
        where: {
          followerId: session.id,
          followingId: { in: Array.from(postOwners) },
        },
        select: { followingId: true },
      });
      followingIds = new Set(following.map((f) => f.followingId));
    }

    // ✅ FIX 5: Filter visible posts
    const visiblePosts = collection.posts.filter((post) => {
      const isPostOwner = post.userId === session.id;
      return (
        isPostOwner ||
        post.visibility === "PUBLIC" ||
        (post.visibility === "FOLLOWERS" && followingIds.has(post.userId))
      );
      // ❌ PRIVATE posts from other users are FILTERED OUT
    });

    // Helper function to extract key and generate signed URL
    const getSignedUrl = async (url: string | null) => {
      if (!url) return null;
      try {
        const key = extractKeyFromUrl(url);
        return await generatePresignedViewUrl(key);
      } catch (error) {
        console.error(`Failed to sign URL: ${url}`, error);
        return null;
      }
    };

    // Process all images in parallel
    const [collectionCover, ...postCovers] = await Promise.all([
      getSignedUrl(collection.coverImage),
      ...visiblePosts.map((post) => getSignedUrl(post.coverImage)),
    ]);

    // Transform data with signed URLs
    const transformedData = {
      ...collection,
      coverImage: collectionCover,
      posts: visiblePosts.map((post, index) => ({
        ...post,
        coverImage: postCovers[index],
        // ✅ OPTIONAL: Add restricted flag for consistent UI
        restricted: false, // All posts here are accessible
      })),
    };

    return {
      success: true,
      data: transformedData,
      message: "Collection fetched successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("Collection fetch failed:", error);
    return {
      success: false,
      error: {
        message: "Failed to load collection",
        code: "SERVER_ERROR",
        details: error instanceof Error ? error.message : undefined,
      },
    };
  }
}
//Now for getting all the Collection of Yours

export async function getMyCollections() {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: {
        message: "Unauthorized access",
        code: "UNAUTHORIZED",
      },
    };
  }

  try {
    // Fetch all collections for the logged-in user
    const collections = await prisma.collection.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        visibility: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    //Check if the user has any collections
    if (collections.length === 0) {
      return {
        success: true,
        data: collections,
        message: "No collections found",
        code: "NO_COLLECTIONS",
      };
    }
    return {
      success: true,
      data: collections,
      message: "Collections fetched successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("getMyCollections error:", error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

//For Getting my own Collections, Draft Private, etc. etc.
export async function getMyOwnCollections() {
  const session = await getSession();
  if (!session?.id) {
    // ✅ FIX 1: Check session.id specifically
    return {
      success: false,
      error: {
        message: "Unauthorized access",
        code: "UNAUTHORIZED",
      },
    };
  }

  try {
    // ✅ FIX 2: Optimized query - use _count instead of loading posts
    const collections = await prisma.collection.findMany({
      where: {
        userId: session.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        coverImage: true,
        visibility: true,
        isDraft: true,
        createdAt: true,
        updatedAt: true,
        // ✅ OPTIMIZED: Use _count instead of loading all post objects
        _count: {
          select: {
            posts: true, // Or add filter: posts: { where: { isDraft: false } }
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // ✅ FIX 3: Enhanced with signed cover images
    const enhanced = await Promise.all(
      collections.map(async (col) => {
        let signedCover = null;
        if (col.coverImage) {
          try {
            const key = extractKeyFromUrl(col.coverImage);
            signedCover = await generatePresignedViewUrl(key);
          } catch (error) {
            console.error(
              `Failed to sign cover image for collection ${col.id}:`,
              error,
            );
            signedCover = col.coverImage; // Fallback
          }
        }

        return {
          id: col.id,
          name: col.name,
          description: col.description,
          coverImage: signedCover,
          visibility: col.visibility,
          isDraft: col.isDraft,
          createdAt: col.createdAt,
          updatedAt: col.updatedAt,
          postCount: col._count.posts, // ✅ From optimized _count
        };
      }),
    );

    // ✅ FIX 4: Better empty state handling
    if (enhanced.length === 0) {
      return {
        success: true,
        data: [],
        message: "No collections found",
        code: "NO_COLLECTIONS_FOUND",
      };
    }

    return {
      success: true,
      data: enhanced,
      message: "Your collections fetched successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("getMyOwnCollections error:", error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

//Handling the Update of a Collection
interface UpdateCollectionParams {
  collectionId: string;
  name?: string;
  description?: string | null;
  isDraft?: boolean;
  visibility?: Visibility;
  coverImage?: string | null;
  tempImageKey?: string | null;
}

export async function updateCollection({
  collectionId,
  name,
  description,
  isDraft,
  visibility,
  coverImage,
  tempImageKey,
}: UpdateCollectionParams) {
  try {
    // 🔐 FIX 1: Add Authentication
    const user = await getSession();
    if (!user?.id) {
      return {
        success: false,
        error: {
          message: "Unauthorized access",
          code: "UNAUTHORIZED",
        },
      };
    }

    // ✅ FIX 2: Input Validation
    if (!collectionId) {
      return {
        success: false,
        error: {
          message: "Collection ID is required",
          code: "INVALID_INPUT",
        },
      };
    }

    // 🔐 FIX 3: Check Collection Ownership
    const existingCollection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: user.id, // ✅ Only user's own collections
      },
    });

    if (!existingCollection) {
      return {
        success: false,
        error: {
          message: "Collection not found",
          code: "NOT_FOUND",
        },
      };
    }

    let finalCoverImage = coverImage;

    // Process image if new one was uploaded
    if (
      tempImageKey &&
      coverImage &&
      coverImage !== existingCollection.coverImage
    ) {
      try {
        // Move from temp to permanent location
        finalCoverImage = await changeFileVisibility(tempImageKey);
      } catch (error) {
        console.error("Failed to move cover image:", error);
        return {
          success: false,
          error: {
            message: "Failed to process cover image",
            code: "IMAGE_PROCESSING_ERROR",
          },
        };
      }
    }

    // Validate visibility against enum values
    const validVisibilities = ["PUBLIC", "PRIVATE", "FOLLOWERS"];
    if (visibility && !validVisibilities.includes(visibility)) {
      return {
        success: false,
        error: {
          message: "Invalid visibility value",
          code: "INVALID_INPUT",
        },
      };
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string | null;
      isDraft?: boolean;
      visibility?: Visibility;
      coverImage?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isDraft !== undefined) updateData.isDraft = isDraft;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (finalCoverImage !== undefined) updateData.coverImage = finalCoverImage;

    // Don't update if no changes
    if (Object.keys(updateData).length === 0) {
      return {
        success: true,
        message: "No changes detected",
        data: existingCollection,
      };
    }

    // 🔐 FIX 4: Secure Update with Ownership Check
    const updatedCollection = await prisma.collection.update({
      where: {
        id: collectionId,
        userId: user.id, // ✅ Prevent unauthorized updates
      },
      data: updateData,
    });

    return {
      success: true,
      message: "Collection updated successfully",
      data: updatedCollection,
    };
  } catch (error) {
    console.error("updateCollection error:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return {
          success: false,
          error: {
            message: "Collection not found or access denied",
            code: "NOT_FOUND",
          },
        };
      }

      return {
        success: false,
        error: {
          message: error.message,
          code: error.message.includes("visibility")
            ? "INVALID_INPUT"
            : "SERVER_ERROR",
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Failed to update collection",
        code: "SERVER_ERROR",
      },
    };
  }
}

//For Deleting a Collection
export async function deleteCollection(collectionId: string) {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: {
        message: "Unauthorized access",
        code: "UNAUTHORIZED",
      },
    };
  }

  try {
    // Find the collection to verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true },
    });

    if (!collection) {
      return {
        success: false,
        error: {
          message: "Collection not found",
          code: "NOT_FOUND",
        },
      };
    }

    if (collection.userId !== session.id) {
      return {
        success: false,
        error: {
          message: "You do not have permission to delete this collection",
          code: "FORBIDDEN",
        },
      };
    }

    // Delete the collection
    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return {
      success: true,
      message: "Collection deleted successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("deleteCollection error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

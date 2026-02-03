"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import { Post } from "@/schemas/post";

interface GetCollectionParams {
  collectionId: string;
}

export async function getCollectionWithSnippets({
  collectionId,
}: GetCollectionParams) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // 1. Fetch the Collection
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!collection) {
      return {
        success: false,
        message: "Collection not found",
        code: "NOT_FOUND",
      };
    }

    const isOwner = currentUserId === collection.userId;

    // --- NEW: Sign Collection Owner Avatar ---
    let signedOwnerAvatar = collection.user.avatar;
    if (collection.user.avatar) {
      try {
        const avatarKey = extractKeyFromUrl(collection.user.avatar);
        signedOwnerAvatar = await generatePresignedViewUrl(avatarKey);
      } catch (e) {
        console.error("Error signing owner avatar:", e);
      }
    }

    // 2. Determine Relationship
    let isFollowing = false;
    if (currentUserId && !isOwner) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: collection.userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    // 3. Visibility Filter
    const snippetVisibilityFilter = isOwner
      ? {}
      : {
          isDraft: false,
          OR: [
            { visibility: "PUBLIC" as any },
            ...(isFollowing ? [{ visibility: "FOLLOWERS" as any }] : []),
          ],
        };

    // 4. Fetch the Snippets
    const rawPosts = await prisma.post.findMany({
      where: {
        collections: { some: { id: collectionId } },
        ...snippetVisibilityFilter,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        images: { where: { isCover: true }, take: 1 },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, comments: true, savedBy: true } },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { userId: true } }
          : false,
        savedBy: currentUserId
          ? { where: { userId: currentUserId }, select: { userId: true } }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Transform and Sign Cover Image for the Collection
    let signedCollectionCover = collection.coverImage;
    if (collection.coverImage) {
      try {
        const key = extractKeyFromUrl(collection.coverImage);
        signedCollectionCover = await generatePresignedViewUrl(key);
      } catch (e) {
        console.error("Collection cover signing error:", e);
      }
    }

    // 6. Transform and Sign Snippets & Author Avatars
    const snippets: Post[] = await Promise.all(
      rawPosts.map(async (p) => {
        let signedPostCover = null;
        let signedAuthorAvatar = p.user.avatar;

        // Sign Post Cover
        const cover = p.images[0];
        if (cover?.url) {
          signedPostCover = await generatePresignedViewUrl(
            extractKeyFromUrl(cover.url),
          );
        }

        // --- NEW: Sign Snippet Author Avatar ---
        if (p.user.avatar) {
          try {
            signedAuthorAvatar = await generatePresignedViewUrl(
              extractKeyFromUrl(p.user.avatar),
            );
          } catch (e) {
            console.error("Error signing snippet author avatar:", e);
          }
        }

        return {
          ...p,
          visibility: p.visibility as any,
          coverImage: signedPostCover,
          user: {
            ...p.user,
            avatar: signedAuthorAvatar,
          },
          images: p.images.map((img) => ({
            ...img,
            url: signedPostCover || img.url,
          })),
          tags: p.tags.map((t) => t.tag.name),
          isLiked: currentUserId ? p.likes.length > 0 : false,
          isSaved: currentUserId ? p.savedBy.length > 0 : false,
          linkTo: `/explore/post/${p.id}`,
        };
      }),
    );

    return {
      success: true,
      data: {
        collection: {
          ...collection,
          coverImage: signedCollectionCover,
          user: {
            ...collection.user,
            avatar: signedOwnerAvatar,
          },
          _count: { posts: snippets.length },
        },
        snippets,
        isOwner,
        currentUserId: currentUserId || null,
      },
    };
  } catch (error) {
    console.error("getCollectionWithSnippets Error:", error);
    return { success: false, message: "Internal server error" };
  }
}

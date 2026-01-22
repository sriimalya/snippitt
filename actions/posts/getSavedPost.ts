"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import type { Post } from "@/schemas/post";

interface GetSavedOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

export async function getSavedPosts(options: GetSavedOptions = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const userId = session.user.id;
    const page = options.page || 1;
    const perPage = options.perPage || 10;
    const skip = (page - 1) * perPage;
    const search = options.search?.trim();

    // 1. Build Search Clause for the nested post
    const postSearchFilter = search ? {
      OR: [
        { title: { contains: search, mode: "insensitive" as any } },
        { description: { contains: search, mode: "insensitive" as any } },
      ],
    } : {};

    // 2. Fetch SavedPosts with full Post relations
    const [savedEntries, totalSaved] = await Promise.all([
      prisma.savedPost.findMany({
        where: {
          userId,
          post: {
            ...postSearchFilter,
            isDraft: false, // Don't show drafts even if saved
          }
        },
        include: {
          post: {
            include: {
              user: { select: { id: true, username: true, avatar: true } },
              images: { where: { isCover: true }, take: 1 },
              tags: { include: { tag: true } },
              _count: { select: { likes: true, comments: true, savedBy: true } },
              likes: { where: { userId }, select: { userId: true } },
              savedBy: { where: { userId }, select: { userId: true } },
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.savedPost.count({
        where: {
          userId,
          post: postSearchFilter
        }
      })
    ]);

    // 3. Transform to Snippet-compatible Post objects
    const posts: Post[] = await Promise.all(
      savedEntries.map(async (entry) => {
        const post = entry.post;
        const coverImage = post.images[0];
        let signedUrl = null;

        if (coverImage?.url) {
          try {
            const key = extractKeyFromUrl(coverImage.url);
            signedUrl = await generatePresignedViewUrl(key);
          } catch (e) {
            signedUrl = coverImage.url;
          }
        }

        return {
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: post.isDraft,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          user: {
            id: post.user.id,
            username: post.user.username,
            avatar: post.user.avatar,
          },
          coverImage: signedUrl,
          // Satisfy Post interface images array
          images: post.images.map(img => ({
            id: img.id,
            url: signedUrl || img.url,
            isCover: img.isCover,
            description: img.description,
            createdAt: img.createdAt,
            updatedAt: img.updatedAt
          })),
          tags: post.tags.map((t) => t.tag.name),
          _count: post._count,
          isLiked: post.likes.length > 0,
          isSaved: true, // We know it's saved because we are in the SavedPost table
          linkTo: `/explore/post/${post.id}`,
        };
      })
    );

    return {
      success: true,
      data: {
        posts,
        pagination: {
          total: totalSaved,
          pages: Math.ceil(totalSaved / perPage),
          currentPage: page,
        },
        currentUserId: userId
      }
    };

  } catch (error) {
    console.error("Fetch Saved Posts Error:", error);
    return { success: false, message: "Failed to fetch saved posts" };
  }
}
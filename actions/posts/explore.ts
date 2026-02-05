"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";
import type { Post } from "@/schemas/post";

interface ExploreOptions {
  page?: number;
  perPage?: number;
  search?: string;
  category?: string;
}

export async function getExplorePosts(options: ExploreOptions = {}) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const page = options.page || 1;
    const perPage = options.perPage || 10;
    const skip = (page - 1) * perPage;
    const search = options.search?.trim();

    // 1. Get following IDs for visibility logic
    let followingIds: string[] = [];
    if (userId) {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      followingIds = following.map((f) => f.followingId);
    }

    // 2. Build the exact same Visibility Filter logic
    const visibilityFilter = {
      OR: [
        { visibility: "PUBLIC" as any },
        ...(userId ? [{ userId: userId }] : []), 
        {
          AND: [
            { visibility: "FOLLOWERS" as any },
            { userId: { in: followingIds } },
          ],
        },
      ],
    };

    const whereClause: any = {
      isDraft: false, 
      ...visibilityFilter,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(options.category && { category: options.category }),
    };

    // 3. Execute Query with exact same "include" structure as getMyPosts
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: { where: { isCover: true }, take: 1 }, 
          tags: { include: { tag: true } },
          _count: { select: { likes: true, comments: true, savedBy: true } },
          likes: userId ? { where: { userId }, select: { userId: true } } : false,
          savedBy: userId ? { where: { userId }, select: { userId: true } } : false,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    // 4. Transform - Mirroring getMyPosts exactly
    const transformedPosts: Post[] = await Promise.all(
      posts.map(async (post) => {
        const coverImage = post.images[0];
        let signedCoverImageUrl = null;

        if (coverImage?.url) {
          try {
            const key = extractKeyFromUrl(coverImage.url);
            signedCoverImageUrl = await generatePresignedViewUrl(key);
          } catch (error) {
            console.error(`Failed to sign URL for post ${post.id}:`, error);
          }
        }

        // Check engagement flags (The logic that makes Like/Save work)
        const hasLiked = userId ? post.likes.length > 0 : false;
        const hasSaved = userId ? post.savedBy.length > 0 : false;

        return {
          id: post.id,
          title: post.title,
          description: post.description,
          category: post.category,
          // Casting visibility to match the schema/post.ts expectations
          visibility: post.visibility as "PUBLIC" | "PRIVATE" | "FOLLOWERS",
          isDraft: post.isDraft,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          user: {
            id: post.user.id,
            username: post.user.username,
            avatar: post.user.avatar,
          },
          coverImage: signedCoverImageUrl,
          // Crucial: satisfying the "images" requirement in Post type
          images: post.images.map((img) => ({
            id: img.id,
            url: signedCoverImageUrl || img.url,
            description: null, 
            isCover: img.isCover,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          })),
          tags: post.tags.map((t) => t.tag.name),
          _count: {
            likes: post._count.likes,
            comments: post._count.comments,
            savedBy: post._count.savedBy,
          },
          isLiked: hasLiked,
          isSaved: hasSaved,
          linkTo: `/post/${post.id}`,
        };
      })
    );

    return {
      success: true,
      data: {
        posts: transformedPosts,
        pagination: {
          total: totalPosts,
          pages: Math.ceil(totalPosts / perPage),
          currentPage: page,
        },
        currentUserId: userId || "", // Useful for the Snippet edit button logic
      },
    };
  } catch (error) {
    console.error("Explore Fetch Error:", error);
    return { success: false, message: "An error occurred while fetching posts" };
  }
}
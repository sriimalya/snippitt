"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

async function signPostImages(posts: any[]) {
  return await Promise.all(
    posts.map(async (post) => {
      // Sign Post Images
      const signedImages = await Promise.all(
        post.images.map(async (img: any) => ({
          ...img,
          url: await generatePresignedViewUrl(extractKeyFromUrl(img.url)),
        })),
      );
      // Sign Author Avatar
      const signedAvatar = post.user.avatar
        ? await generatePresignedViewUrl(extractKeyFromUrl(post.user.avatar))
        : null;

      return {
        ...post,
        images: signedImages,
        user: { ...post.user, avatar: signedAvatar },
      };
    }),
  );
}

export async function getDashboardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: "Unauthorized" };

  const userId = session.user.id;

  try {
    const [stats, recentPosts, drafts, collections] = await Promise.all([
      // 1. Stats: Following/Followers count
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: { followers: true, followings: true },
          },
        },
      }),

      // 2. Recent Posts (Latest 3 Published)
      prisma.post.findMany({
        where: { userId, isDraft: false },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: true,
          _count: { select: { likes: true, comments: true } },
        },
      }),

      // 3. Drafts (Latest 3)
      prisma.post.findMany({
        where: { userId, isDraft: true },
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: true,
          _count: { select: { likes: true, comments: true } },
        },
      }),

      // 4. Collections (Latest 3)
      prisma.collection.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { posts: true } },
        },
      }),
    ]);

    // Sign S3 URLs for Posts and Drafts
    const [signedPosts, signedDrafts] = await Promise.all([
      signPostImages(recentPosts),
      signPostImages(drafts),
    ]);

    return {
      success: true,
      data: {
        stats: stats?._count || { followers: 0, following: 0 },
        recentPosts: signedPosts,
        drafts: signedDrafts,
        collections: collections,
      },
    };
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    return { success: false, message: "Failed to load dashboard data" };
  }
}

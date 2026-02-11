"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

async function getValidImageUrl(url: string | null | undefined) {
  if (!url) return null;

  const isExternal =
    url.includes("googleusercontent.com") ||
    (url.includes("http") && !url.includes("amazonaws.com"));

  if (isExternal) return url;

  try {
    const key = extractKeyFromUrl(url);
    return await generatePresignedViewUrl(key);
  } catch (error) {
    console.error("S3 Signing failed for URL:", url, error);
    return url; 

  }
}

async function signPostImages(posts: any[]) {
  return await Promise.all(
    posts.map(async (post) => {

      const signedImages = await Promise.all(
        post.images.map(async (img: any) => ({
          ...img,
          url: await getValidImageUrl(img.url),
        })),
      );

      const coverImageData =
        post.images.find((img: any) => img.isCover === true) || post.images[0]; 

      const signedCoverUrl = await getValidImageUrl(coverImageData?.url);

      const signedAvatar = await getValidImageUrl(post.user.avatar);

      return {
        ...post,
        images: signedImages,

        coverImage: signedCoverUrl,
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
    const [userData, recentPosts, drafts, collections] = await Promise.all([

      prisma.user.findUnique({
        where: { id: userId },
        select: {
          avatar: true,
          _count: { select: { followers: true, followings: true } },
        },
      }),

      prisma.post.findMany({
        where: { userId, isDraft: false },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: true, 

          _count: { select: { likes: true, comments: true, savedBy: true } },
        },
      }),

      prisma.post.findMany({
        where: { userId, isDraft: true },
        take: 3,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          images: true,
          _count: { select: { likes: true, comments: true, savedBy: true } },
        },
      }),

      prisma.collection.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { posts: true } },
        },
      }),
    ]);

    const [signedPosts, signedDrafts, signedDashboardAvatar] =
      await Promise.all([
        signPostImages(recentPosts),
        signPostImages(drafts),
        getValidImageUrl(userData?.avatar),
      ]);

    return {
      success: true,
      data: {
        stats: {
          ...(userData?._count || { followers: 0, followings: 0 }),
          avatar: signedDashboardAvatar,
        },
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


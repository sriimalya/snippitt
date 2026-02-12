"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, generatePresignedViewUrl } from "@/lib/aws_s3";

async function getSignedAvatar(url: string | null | undefined) {
  if (!url) return null;
  const isExternal =
    url.includes("googleusercontent.com") ||
    (url.includes("http") && !url.includes("amazonaws.com"));
  if (isExternal) return url;

  try {
    const key = extractKeyFromUrl(url);
    return await generatePresignedViewUrl(key);
  } catch {
    return url;
  }
}

export async function getFollowingList(profileId: string) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const followingData = await prisma.follow.findMany({
      where: { followerId: profileId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                followings: true,
              },
            },
            // Check if the LOGGED IN user follows these people
            followers: currentUserId
              ? {
                  where: { followerId: currentUserId },
                  select: { followerId: true },
                }
              : false,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Transform data for the UI
    const users = await Promise.all(
      followingData.map(async (record) => {
        const user = record.following;
        const signedAvatar = await getSignedAvatar(user.avatar);

        return {
          id: user.id,
          username: user.username,
          avatar: signedAvatar,
          bio: user.bio,
          followerCount: user._count.followers,
          followingCount: user._count.followings,
          // True if currentUserId is found in the followers array of this user
          isFollowing: currentUserId
            ? (user.followers?.length ?? 0) > 0
            : false,
          isMe: currentUserId === user.id,
        };
      }),
    );

    return { success: true, data: users };
  } catch (error) {
    console.error("getFollowingList Error:", error);
    return { success: false, message: "Failed to load following list" };
  }
}

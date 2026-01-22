"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
  try {
    const session = await getServerSession(authOptions);
    const followerId = session?.user?.id;

    if (!followerId) {
      return { success: false, message: "You must be logged in to follow users." };
    }

    if (followerId === targetUserId) {
      return { success: false, message: "You cannot follow yourself." };
    }

    // 1. Check if the follow relationship already exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 2. Unfollow logic
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      });

      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, message: "Unfollowed successfully", followed: false };
    } else {
      // 3. Follow logic
      await prisma.follow.create({
        data: {
          followerId,
          followingId: targetUserId,
        },
      });

      // Optional: You could trigger a notification here later
      revalidatePath(`/profile/${targetUserId}`);
      return { success: true, message: "Followed successfully", followed: true };
    }
  } catch (error) {
    console.error("Toggle Follow Error:", error);
    return { success: false, message: "Database error occurred." };
  }
}
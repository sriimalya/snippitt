"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Follows a user
export async function followUser(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return {
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    if (session.id === userId) {
      return {
        success: false,
        message: "You cannot follow yourself",
        code: "INVALID_ACTION",
      };
    }

    await prisma.follow.create({
      data: {
        followerId: session.id,
        followingId: userId,
      },
    });

    return {
      success: true,
      message: "Followed successfully",
    };
  } catch (error) {
    console.error("Follow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Follow failed",
      code: "FOLLOW_FAILED",
    };
  }
}

// Unfollows a user
export async function unfollowUser(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return {
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.id,
          followingId: userId,
        },
      },
    });

    return {
      success: true,
      message: "Unfollowed successfully",
    };
  } catch (error) {
    console.error("Unfollow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unfollow failed",
      code: "UNFOLLOW_FAILED",
    };
  }
}

// Toggles follow/unfollow
export async function toggleFollow(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return {
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    if (session.id === userId) {
      return {
        success: false,
        message: "You cannot follow yourself",
        code: "INVALID_ACTION",
      };
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.id,
          followingId: userId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.id,
            followingId: userId,
          },
        },
      });
      return {
        success: true,
        following: false,
        message: "Unfollowed",
      };
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.id,
          followingId: userId,
        },
      });
      return {
        success: true,
        following: true,
        message: "Followed",
      };
    }
  } catch (error) {
    console.error("Toggle follow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Toggle failed",
      code: "TOGGLE_FAILED",
    };
  }
}

// Checks if the logged-in user follows a given user
export async function isFollowing(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        following: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const session = await getSession();
    if (!session?.id) {
      return {
        success: false,
        following: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      };
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.id,
          followingId: userId,
        },
      },
    });

    return {
      success: true,
      following: !!follow,
    };
  } catch (error) {
    console.error("isFollowing error:", error);
    return {
      success: false,
      following: false,
      message: "Failed to check follow status",
      code: "CHECK_FAILED",
    };
  }
}

// Get a user's followers
export async function getFollowers(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }
    //Get the followers only if the user follows that UserId

        const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
            follower: {
            select: { id: true, username: true, email: true },
            },
        },
        });

    return {
      success: true,
      message: "Followers fetched",
      data: followers.map((f) => f.follower),
    };
  } catch (error) {
    console.error("getFollowers error:", error);
    return {
      success: false,
      message: "Failed to get followers",
      code: "FETCH_FAILED",
    };
  }
}

// Get a user's following list
export async function getFollowing(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    return {
      success: true,
      message: "Following fetched",
      data: following.map((f) => f.following),
    };
  } catch (error) {
    console.error("getFollowing error:", error);
    return {
      success: false,
      message: "Failed to get following",
      code: "FETCH_FAILED",
    };
  }
}

// Get total follower count
export async function getFollowerCount(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const count = await prisma.follow.count({
      where: { followingId: userId },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("getFollowerCount error:", error);
    return {
      success: false,
      message: "Failed to get follower count",
      code: "COUNT_FAILED",
    };
  }
}

// Get total following count
export async function getFollowingCount(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "Invalid user ID",
        code: "INVALID_USER_ID",
      };
    }

    const count = await prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("getFollowingCount error:", error);
    return {
      success: false,
      message: "Failed to get following count",
      code: "COUNT_FAILED",
    };
  }
}

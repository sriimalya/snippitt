"use server";
import { getSession } from "@/lib/auth";
import {
  changeFileVisibility,
  extractKeyFromUrl,
  generatePresignedViewUrl,
} from "@/lib/aws-s3";
import prisma from "@/lib/prisma";
import { updateUserSchema } from "@/schemas/user";

export async function getBasicUserDetails() {
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
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        phone: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: {
          message: "User not found",
          code: "NOT_FOUND",
        },
      };
    }
    //For avatar lets do the getting final key and then singing it
    if (user.avatar) {
      const avatarKey = extractKeyFromUrl(user.avatar); // REQUIRED
      user.avatar = await generatePresignedViewUrl(avatarKey);
    } else {
      user.avatar = null;
    }

    return {
      success: true,
      data: user,
      message: "User details fetched successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("getBasicUserDetails error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

export async function updateUserAvatar(tempUrl: string) {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  }

  if (!tempUrl) {
    return {
      success: false,
      error: {
        message: "No avatar image provided",
        code: "NO_AVATAR",
      },
    };
  }

  try {
    const tempKey = extractKeyFromUrl(tempUrl);

    // Move from temp/ to uploads/
    const finalKey = await changeFileVisibility(tempKey);

    // Update avatar key in DB
    await prisma.user.update({
      where: { id: session.id },
      data: {
        avatar: finalKey,
      },
    });

    // Return signed URL to preview
    const signedAvatarUrl = await generatePresignedViewUrl(finalKey);

    return {
      success: true,
      message: "Avatar updated successfully",
      code: "SUCCESS",
      data: {
        avatar: signedAvatarUrl,
      },
    };
  } catch (error) {
    console.error("updateUserAvatar error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

export async function updateBasicUserInfo(formData: unknown) {
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

  const parsed = updateUserSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: "Invalid input",
        code: "VALIDATION_ERROR",
        issues: parsed.error.flatten(),
      },
    };
  }

  const { username, email, bio, phone, deactivateAccount } = parsed.data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        username,
        email,
        bio,
        phone,
        isActive: deactivateAccount ?? false, // default to false if not provided
      },
    });

    return {
      success: true,
      code: "SUCCESS",
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        isActive: updatedUser.isActive,
      },
    };
  } catch (error) {
    console.error("updateBasicUserInfo error:", error);
    return {
      success: false,
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    };
  }
}

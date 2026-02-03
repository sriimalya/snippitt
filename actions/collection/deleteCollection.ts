"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { extractKeyFromUrl, deleteFile } from "@/lib/aws_s3"; 
import { revalidatePath } from "next/cache";

export async function deleteCollection(collectionId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      };
    }

    // 1. Find the collection AND its cover image URL
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { userId: true, coverImage: true },
    });

    if (!collection) {
      return {
        success: false,
        error: { message: "Collection not found", code: "NOT_FOUND" },
      };
    }

    // 2. Verify Ownership
    if (collection.userId !== session.user.id) {
      return {
        success: false,
        error: { message: "Forbidden", code: "FORBIDDEN" },
      };
    }

    // 3. Handle S3 Cleanup FIRST (Best practice: delete files before DB record)
    if (collection.coverImage) {
      try {
        const fileKey = extractKeyFromUrl(collection.coverImage);
        // Ensure we don't delete shared assets or default placeholders
        if (fileKey.includes("uploads/")) {
          await deleteFile(fileKey);
        }
      } catch (s3Error) {
        console.error("S3 Deletion Warning:", s3Error);
        // We continue deleting the DB record even if S3 fails
      }
    }

    // 4. Delete the collection from Database
    await prisma.collection.delete({
      where: { id: collectionId },
    });

    // 5. Clear Cache
    revalidatePath("/dashboard/collections");
    revalidatePath(`/profile/${session.user.id}/collections`);

    return {
      success: true,
      message: "Collection and associated media deleted successfully",
      code: "SUCCESS",
    };
  } catch (error) {
    console.error("deleteCollection error:", error);
    return {
      success: false,
      error: { message: "Internal server error", code: "SERVER_ERROR" },
    };
  }
}

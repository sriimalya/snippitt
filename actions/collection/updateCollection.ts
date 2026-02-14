"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { revalidatePath } from "next/cache";
import {
  extractKeyFromUrl,
  changeFileVisibility,
  moveFileToTrash,
} from "@/lib/aws_s3";
import { z } from "zod";

const UpdateCollectionSchema = z.object({
  collectionId: z.string(),
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS"]),
  coverImage: z.string().nullable().optional(),
});

export async function updateCollection(
  input: z.infer<typeof UpdateCollectionSchema>,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = session.user.id;
    const { collectionId, ...data } = UpdateCollectionSchema.parse(input);

    // 1. Verify Ownership
    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existingCollection) {
      return { success: false, message: "Collection not found" };
    }

    if (existingCollection.userId !== userId) {
      return {
        success: false,
        message: "You do not have permission to edit this collection",
      };
    }

    const updatePayload: any = {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
    };

    // 2. Handle Cover Image S3 Logic
    // 2. Handle Cover Image S3 Logic
    if (data.coverImage && data.coverImage !== existingCollection.coverImage) {
      try {
        // If the new image is in the 'temp' folder, move it to 'uploads' (and 'trash')
        if (data.coverImage.includes("/temp/")) {
          const tempKey = extractKeyFromUrl(data.coverImage);

          // This call is now idempotent thanks to your lib/aws_s3.ts changes
          const permanentUrl = await changeFileVisibility(tempKey);

          updatePayload.coverImage = permanentUrl.split("?")[0];

          // Safely handle old cover image cleanup
          if (
            existingCollection.coverImage &&
            existingCollection.coverImage.includes("uploads/")
          ) {
            const oldKey = extractKeyFromUrl(existingCollection.coverImage);
            // Use the trash helper instead of permanent deletion
            await moveFileToTrash(oldKey);
          }
        } else {
          // If it's already a permanent URL, just sync the sanitized version
          updatePayload.coverImage = data.coverImage.split("?")[0];
        }
      } catch (error: any) {
        // Handle the case where a previous failed DB update already moved the file
        if (error.message === "SOURCE_MISSING") {
          console.warn(
            "Cover image already moved from temp, using current URL as-is",
          );
          updatePayload.coverImage = data.coverImage.split("?")[0];
        } else {
          console.error("Critical S3 Processing Error:", error);
          // Optional: You can choose to throw here if you want to block the DB update on S3 failure
          // throw error;
        }
      }
    }

    // 3. Update Database
    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: updatePayload,
    });

    // 4. Revalidate cache
    revalidatePath(`/explore/collection/${collectionId}`);
    revalidatePath(`/dashboard/collections`);
    revalidatePath(`/profile/${userId}/collections`);

    return {
      success: true,
      message: "Collection updated successfully",
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.issues);
      return { success: false, message: error.issues[0].message };
    }
    console.error("updateCollection Error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

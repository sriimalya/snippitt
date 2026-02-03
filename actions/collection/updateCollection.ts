"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { revalidatePath } from "next/cache";
import { 
  extractKeyFromUrl, 
  deleteFile, 
  changeFileVisibility 
} from "@/lib/aws_s3";
import { z } from "zod";

// Validation Schema
const UpdateCollectionSchema = z.object({
  collectionId: z.string(),
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(200).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS"]),
  coverImage: z.string().optional(), 
});

export async function updateCollection(input: z.infer<typeof UpdateCollectionSchema>) {
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
      return { success: false, message: "You do not have permission to edit this collection" };
    }

    const updatePayload: any = {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
    };

    // 2. Handle Cover Image S3 Logic
    if (data.coverImage && data.coverImage !== existingCollection.coverImage) {
      try {
        // If the new image is in the 'temp' folder, move it to 'uploads'
        if (data.coverImage.includes("/temp/")) {
          const tempKey = extractKeyFromUrl(data.coverImage);
          const permanentUrl = await changeFileVisibility(tempKey);
          
          // Use the clean URL (no query params) for the database
          updatePayload.coverImage = permanentUrl.split("?")[0];

          // If there was an old custom cover image, delete it from S3
          if (existingCollection.coverImage) {
            const oldKey = extractKeyFromUrl(existingCollection.coverImage);
            // Optional: Only delete if it's not a default placeholder
            if (oldKey.includes("uploads/")) {
                await deleteFile(oldKey);
            }
          }
        } else {
            // If it's already a permanent URL (not changed), just keep it
            updatePayload.coverImage = data.coverImage;
        }
      } catch (error) {
        console.error("S3 Processing Error:", error);
        // We continue with the database update even if cleanup fails
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
      data: updated 
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.issues[0].message };
    }
    console.error("updateCollection Error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
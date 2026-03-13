"use server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  
} from "@/lib/aws_s3";
import { Visibility } from "@/app/generated/prisma/enums";

export async function createCollection(input: string | {
  name: string;
  description?: string;
  coverImage?: string;
  visibility?: Visibility;
  isDraft?: boolean;
}) {
  const session = await getSession();
  if (!session?.id)
    return {
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    };

  const name = typeof input === "string" ? input : input.name;
  const description = typeof input === "string" ? undefined : input.description;
  const coverImage = typeof input === "string" ? undefined : input.coverImage;
  const visibility = typeof input === "string" ? undefined : input.visibility;
  const isDraft = typeof input === "string" ? false : !!input.isDraft;

  try {
    const existing = await prisma.collection.findFirst({
      where: {
        userId: session.id,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing)
      return {
        success: false,
        error: { message: "Name already exists", code: "DUPLICATE" },
      };

    const newCol = await prisma.collection.create({
      data: { 
        name, 
        userId: session.id,
        description,
        coverImage,
        visibility: visibility || Visibility.PRIVATE,
        isDraft
      },
    });

    return { success: true, data: newCol };
  } catch (error) {
    console.error("Create collection error:", error);
    return {
      success: false,
      error: { message: "Failed to create", code: "SERVER_ERROR" },
    };
  }
}

export async function addNewPostToCollection(
  collectionId: string,
  postId: string,
) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    // 1. Check if the post is already in this specific collection
    const existing = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.id,
        posts: { some: { id: postId } },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: "Post is already in this collection",
          code: "ALREADY_EXISTS",
        },
      };
    }

    // 2. Perform the connection
    await prisma.collection.update({
      where: { id: collectionId, userId: session.id },
      data: {
        posts: {
          connect: { id: postId },
        },
      },
    });

    return { success: true, message: "Added to collection" };
  } catch (error) {
    console.error("Add to collection error:", error);
    return {
      success: false,
      error: { message: "Failed to add post", code: "SERVER_ERROR" },
    };
  }
}

export async function removePostFromCollection(
  collectionId: string,
  postId: string,
) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    // 1. Check if the post actually exists in the collection first
    const existing = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId: session.id,
        posts: { some: { id: postId } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: {
          message: "Post not found in this collection",
          code: "NOT_FOUND",
        },
      };
    }

    // 2. Perform the disconnection
    await prisma.collection.update({
      where: { id: collectionId, userId: session.id },
      data: {
        posts: {
          disconnect: { id: postId },
        },
      },
    });

    return { success: true, message: "Removed from collection" };
  } catch (error) {
    console.error("Remove from collection error:", error);
    return {
      success: false,
      error: { message: "Failed to remove post", code: "SERVER_ERROR" },
    };
  }
}
//Fetching all Collections of the User
//Add that preSigned URL for the cover image if it exists
export async function getUserCollectionNames(postId: string) {
  const session = await getSession();
  if (!session?.id)
    return { success: false, error: { message: "Unauthorized" } };

  try {
    const collections = await prisma.collection.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        // ✅ Check if this specific post exists in the collection
        posts: {
          where: { id: postId },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform to include a simple boolean
    const data = collections.map((col) => ({
      id: col.id,
      name: col.name,
      hasPost: col.posts.length > 0,
    }));

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: { message: "Failed to fetch collections" },
    };
  }
}
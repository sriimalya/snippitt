"use server";

import prisma from "@/lib/prisma";
import { CreatePostSchema, CreatePostInput } from "@/schemas/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

export async function createPost(data: CreatePostInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to create a post",
        code: "UNAUTHORIZED",
      };
    }

    const userId = session.user.id;

    // 2️⃣ Validate input
    const validatedData = CreatePostSchema.parse(data);
    const { title, description, category, tags } = validatedData;

    // 3️⃣ Create post
    const post = await prisma.post.create({
      data: {
        title,
        description,
        category,
        userId,
        isDraft: true,

        tags: {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag.toLowerCase() },
                create: { name: tag.toLowerCase() },
              },
            },
          })),
        },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return {
      success: true,
      message: "Post created successfully",
      data: post,
    };
  } catch (error) {
    console.error("Error creating post:", error);

    return {
      success: false,
      message: "An error occurred while creating the post",
      code: "CREATE_POST_FAILED",
    };
  }
}

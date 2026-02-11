// lib/aws-s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
}

export async function generatePresignedUrl(
  fileName: string,
  fileType: string,
  userId: string,
): Promise<PresignedUrlResponse> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `temp/${userId}/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    fileUrl,
  };
}

// export async function changeFileVisibility(oldKey: string): Promise<string> {
//   // 1. If it's already an upload key, don't try to move it!
//   if (oldKey.startsWith("uploads/")) {
//     return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${oldKey}`;
//   }

//   const fileName = oldKey.split("/").pop()!;
//   const newKey = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;

//   try {
//     await s3Client.send(
//       new CopyObjectCommand({
//         Bucket: BUCKET_NAME,
//         CopySource: encodeURI(`${BUCKET_NAME}/${oldKey}`), // Always encode!
//         Key: newKey,
//       }),
//     );

//     await deleteFile(oldKey);
//     return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
//   } catch (error: any) {
//     // 2. If the file is missing, it likely moved in a previous (failed) attempt
//     if (error.Code === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
//       console.warn(
//         "File already moved or missing. Checking if it exists in destination...",
//       );
//       // Logic: If we can't find it in temp, we assume it's either gone or already handled.
//       // You can return a special string or handle it gracefully in the caller.
//       throw new Error("SOURCE_MISSING");
//     }
//     throw error;
//   }
// }
export async function changeFileVisibility(oldKey: string): Promise<string> {
  // 1. Guard: If it's already an upload key, just return the full URL
  if (oldKey.startsWith("uploads/")) {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${oldKey}`;
  }

  const fileName = oldKey.split("/").pop()!;
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);

  const newKey = `uploads/${timestamp}-${randomSuffix}-${fileName}`;
  const trashKey = `trash/${timestamp}-${fileName}`;

  try {
    // 2. Copy to Permanent Location (uploads/)
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: encodeURI(`${BUCKET_NAME}/${oldKey}`),
        Key: newKey,
      }),
    );

    // 3. Copy to Safety Location (trash/)
    // This allows us to recover files if the DB transaction fails later
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: encodeURI(`${BUCKET_NAME}/${oldKey}`),
        Key: trashKey,
      }),
    );

    // 4. Delete from Temp
    await deleteFile(oldKey);

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
  } catch (error: any) {
    // 5. Handle Retry Logic: If file is missing from temp, it was likely moved already
    if (error.Code === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      console.warn(
        `Source ${oldKey} missing. It may have been processed in a previous attempt.`,
      );

      // If the URL contains 'temp' but the file is gone,
      // we return a specific error so the caller knows to look at the provided URL as-is
      throw new Error("SOURCE_MISSING");
    }
    throw error;
  }
}

/**
 * Helper to move existing files to trash instead of permanent deletion
 */
export async function moveFileToTrash(key: string): Promise<void> {
  try {
    const fileName = key.split("/").pop()!;
    const trashKey = `trash/${Date.now()}-${fileName}`;

    await s3Client.send(
      new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: encodeURI(`${BUCKET_NAME}/${key}`),
        Key: trashKey,
      }),
    );
    await deleteFile(key);
  } catch (error) {
    console.error("Soft delete to trash failed:", error);
  }
}
export async function deleteFile(key: string): Promise<void> {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(deleteCommand);
}

export function generateFinalKey(
  _userId: string, // Not needed anymore (kept for backward compatibility)
  _postId: string, // Not needed anymore
  fileName: string, // Original filename
  // // Optional (unused in new structure)
): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const randomSuffix = Math.random().toString(36).slice(2, 8); // Avoid collisions
  return `uploads/${randomSuffix}-${sanitizedFileName}`;
}
export function extractKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove leading slash and any query parameters (for signed URLs)
    const fullPath = urlObj.pathname.substring(1);
    // Split at '?' to remove query parameters if present
    const [key] = fullPath.split("?");
    return key;
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    throw new Error("Invalid S3 URL format");
  }
}

//Utitlity function to get Images with presigned URLs
export async function generatePresignedViewUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60, // 1 hour
  });

  return signedUrl;
}
type PostWithImages = {
  id: string;
  coverImage: string | null;
  images: { url: string }[];
};
export async function enhancePostsWithSignedUrls(posts: PostWithImages[]) {
  return Promise.all(
    posts.map(async (post) => {
      if (post.coverImage) {
        const coverKey = extractKeyFromUrl(post.coverImage);
        post.coverImage = await generatePresignedViewUrl(coverKey);
      }

      post.images = await Promise.all(
        post.images.map(async (img) => {
          const key = extractKeyFromUrl(img.url);
          const signedUrl = await generatePresignedViewUrl(key);
          return { ...img, url: signedUrl };
        }),
      );

      return post;
    }),
  );
}

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
  userId: string
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

export async function changeFileVisibility(oldKey: string): Promise<string> {
  // Extract just the filename from the temp path
  const fileName = oldKey.split('/').pop()!;
  
  // Generate final key with proper naming
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const newKey = `uploads/${timestamp}-${randomSuffix}-${sanitizedFileName}`;

  console.log(`Moving S3 file: ${oldKey} -> ${newKey}`);

  // Copy to permanent location
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${oldKey}`,
      Key: newKey,
    })
  );

  // Delete temp file
  await deleteFile(oldKey);

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
}

export async function deleteFile(key: string): Promise<void> {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(deleteCommand);
}

export function generateFinalKey(
  _userId: string,      // Not needed anymore (kept for backward compatibility)
  _postId: string,      // Not needed anymore
  fileName: string,     // Original filename
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
    const [key] = fullPath.split('?');
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
        })
      );

      return post;
    })
  );
}

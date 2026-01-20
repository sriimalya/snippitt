// actions/upload/generatePresignedUrl.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { generatePresignedUrl as generateS3PresignedUrl} from "@/lib/aws_s3";

export interface GeneratePresignedUrlInput {
  fileName: string;
  fileType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
}

export async function generatePresignedUrlAction(
  input: { fileName: string; fileType: string }
): Promise<{
  success: boolean;
  message: string;
  code?: string;
  data?: { uploadUrl: string; key: string; fileUrl: string };
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const { fileName, fileType } = input;

    if (!fileName || !fileType) {
      return {
        success: false,
        message: "fileName and fileType are required",
        code: "MISSING_FILE_NAME_OR_FILE_TYPE",
      };
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/webm",
    ];

    if (!allowedTypes.includes(fileType)) {
      return {
        success: false,
        message: "File type not supported",
        code: "FILE_TYPE_NOT_SUPPORTED",
      };
    }

    // FIX: Call the S3 function with correct parameters
    const presignedData = await generateS3PresignedUrl(
      fileName,    // string
      fileType,    // string  
      session.user.id // string
    );

    return {
      success: true,
      message: "Presigned URL generated successfully",
      data: presignedData,
    };
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return {
      success: false,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    };
  }
}
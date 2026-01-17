"use server";
import prisma from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Explicitly use Gmail service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Standardized response format
type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
};

// For Generating and Sending an Email to Existing But Unverified User
export async function sendVerificationToken(
  email: string
): Promise<ApiResponse<{ expiresAt: Date }>> {
  let createdTokenId: string | null = null;

  try {
    if (!email) {
      return {
        success: false,
        message: "Email is required",
        code: "INVALID_INPUT",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, username: true },
    });

    if (!user) {
      return {
        success: false,
        message: "No account found with this email",
        code: "USER_NOT_FOUND",
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        message: "Your email is already verified",
        code: "EMAIL_ALREADY_VERIFIED",
      };
    }

    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        purpose: "email_verification",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingToken) {
      const remainingTime = Math.ceil(
        (existingToken.expiresAt.getTime() - Date.now()) / (1000 * 60)
      );

      return {
        success: false,
        message: `A verification code was already sent. You can request a new one in ${remainingTime} minutes.`,
        code: "TOKEN_ALREADY_SENT",
      };
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save token
    const tokenRecord = await prisma.verificationToken.create({
      data: {
        token: otp,
        expiresAt,
        userId: user.id,
        purpose: "email_verification",
      },
    });

    createdTokenId = tokenRecord.id;

    // Try sending email
    await transporter.sendMail({
      from: `"Account Verification" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #4CAF50;">Email Verification</h2>
          <p>Hi,</p>
          <p>Your OTP is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</p>
          <p>Valid for 15 minutes.</p>
        </div>
      `,
    });

    return {
      success: true,
      message: "Verification code sent to your email",
      data: { expiresAt },
    };
  } catch (error) {
    console.error("Email send failed:", error);

    // 🔥 Cleanup token if email failed
    if (createdTokenId) {
      await prisma.verificationToken.delete({
        where: { id: createdTokenId },
      });
    }

    throw error; // rethrow for controller/middleware
  }
}


// For Verifying the OTP
export async function verifyToken(
  email: string,
  otp: string
): Promise<ApiResponse> {
  try {
    // Validate inputs
    if (!email) {
      return {
        success: false,
        message: "Email is required",
        code: "INVALID_INPUT",
      };
    }

    if (!otp) {
      return {
        success: false,
        message: "Verification code is required",
        code: "INVALID_INPUT",
      };
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    if (!user) {
      return {
        success: false,
        message: "No account found with this email",
        code: "USER_NOT_FOUND",
      };
    }

    // Check if already verified
    if (user.emailVerified) {
      return {
        success: true,
        message: "Email is already verified",
      };
    }

    // Find and validate token
     const verificationToken = await prisma.verificationToken.findFirst({
      where: { 
        userId: user.id, 
        token: otp,
        purpose: "email_verification" // Add purpose filter
      },
    });

    if (!verificationToken) {
      return {
        success: false,
        message: "Invalid verification code",
        code: "INVALID_TOKEN",
      };
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      });
      return {
        success: false,
        message: "Verification code has expired. Please request a new one.",
        code: "TOKEN_EXPIRED",
      };
    }

    // Update user and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      success: false,
      message: "Failed to verify email. Please try again later.",
      code: "SERVER_ERROR",
    };
  }
}

export async function checkVerificationToken(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        purpose: "email_verification", // Add purpose filter
        expiresAt: { gt: new Date() },
      },
    });

    return {
      success: true,
      expiresAt: token?.expiresAt || null,
      exists: !!token,
    };
  } catch (error) {
    console.error("Error checking verification token:", error);
    return { success: false, message: "Error checking token" };
    
  }
}

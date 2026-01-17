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
export async function sendPasswordResetToken(
  email: string
): Promise<ApiResponse<{ expiresAt: Date }>> {
  try {
    // Validate email
    if (!email) {
      return {
        success: false,
        message: "Email is required",
        code: "INVALID_INPUT",
      };
    }

    // Check if user exists
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

    // Check for existing valid token
    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        purpose: "password_reset", // Add purpose filter
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

    // Generate and save new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

await prisma.verificationToken.create({
      data: {
        token: otp,
        expiresAt,
        userId: user.id,
        purpose: "password_reset", // Add purpose
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"Password Reset" <${
        process.env.EMAIL_FROM || process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #4CAF50;">Reset Your Password</h2>
          <p>Hi,</p>
          <p>Please use the following OTP to Reset your Password :</p>
          <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</p>
          <p>This OTP is valid for the next 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br/>The Team</p>
        </div>
      `,
    });

    return {
      success: true,    
      message: "Verification code sent to your email",
      data: { expiresAt },
    };
  } catch (error) {
    console.error("Error sending verification token:", error);
    return {
      success: false,
      message: "Failed to send verification code. Please try again later.",
      code: "SERVER_ERROR",
    };
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


    // Find and validate token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { 
        userId: user.id, 
        token: otp,
        purpose: "password_reset" // Add purpose filter
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
      prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      success: false,
      message: "Failed to verify OTP. Please try again later.",
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
        purpose: "password_reset", // Add purpose filter
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

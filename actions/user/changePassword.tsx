"use server";
import prisma from "@/lib/prisma";
import { hashData } from "@/lib/auth";

//Create a function that takes a password and a userId and updates the password for that user
export async function changePassword(password: string, email: string) {
  try {
    // Validate input
    if (!password || !email) {
      return {
        success: false,
        message: "Password and Email are required",
        code: "INVALID_INPUT",
      };
    }

    // Hash the new password
    const hashedPassword = await hashData(password);

    // Update the user's password in the database
    await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "An error occurred while updating the password",
      code: "UPDATE_FAILED",
    };
  }
}

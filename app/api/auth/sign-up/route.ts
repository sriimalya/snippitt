import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SignupSchema } from "@/schemas/auth";
import { hashData } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Redact sensitive fields for logging
    const safeBody = {
      ...body,
      password: "[REDACTED]",
    };

    // Validate the request body using Zod
    const validation = SignupSchema.safeParse(body);
    if (!validation.success) {
      // Transform Zod errors into user-friendly messages
      const userFriendlyErrors = validation.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          message: "Validation failed. Please check your input.",
          code: "VALIDATION_ERROR",
          errors: userFriendlyErrors,
        },
        { status: 400 },
      );
    }

    const { email, username, password, phone } = validation.data;

    // Check if the user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          ...(phone ? [{ phone }] : []), // Only include phone check if provided
        ],
      },
    });

    if (existingUser?.email === email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists. Please use a different email.",
          code: "EMAIL_CONFLICT",
        },
        { status: 409 },
      );
    }
    if (existingUser?.username === username) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This username is already taken. Please choose a different one.",
          code: "USERNAME_CONFLICT",
        },
        { status: 409 },
      );
    }
    //Might Need to Delete if Null Values Start Equalling With Each Other
    if (phone && existingUser?.phone === phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This Phone Number is already there. Please choose a different one.",
          code: "PHONENUMBER_CONFLICT",
        },
        { status: 409 },
      );
    }

    // Hash the password, securityAnswer
    const hashedPassword = await hashData(password);

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        phone: phone,
      },
    });

    // Return only necessary fields
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    };

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user: userResponse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}

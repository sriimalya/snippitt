import bcrypt from "bcrypt";
import { authOptions } from "./auth-providers";
import { getServerSession } from "next-auth";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

// Hash a password or Security Answer
export async function hashData(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare a password / Security Answer with a hash
export async function verifyData(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// src/lib/utils.ts
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// lib/utils.ts
export function generateUsername(base: string): string {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .substring(0, 15);
  const randomSuffix = Math.floor(Math.random() * 1000);
  return `${sanitized}${randomSuffix}`;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session?.user;
}
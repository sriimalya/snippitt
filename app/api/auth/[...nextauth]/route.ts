//For SignIn
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-providers";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

"use client";
import React, { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import EmailInput from "@/app/components/inputFields/EmailInput";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginSchema } from "@/schemas/auth";
import Button from "@/app/components/Button";
import Image from "next/image";
import img from "@/public/assets/ChatGPT Image Sep 30, 2025, 07_22_59 AM.png";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: "" }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: "" }));
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrors({ form: "Please fill out all fields." });
      return;
    }

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((err) => {
        fieldErrors[err.path.join('.')] = err.message; // Use join to create a string key
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        const errorData = JSON.parse(result.error);
        setErrors({
          form: errorData.message || "Invalid credentials. Please try again.",
        });
      } else {
        const session = await getSession();
        if (session?.user?.emailVerified === true) {
          router.push("/dashboard");
        } else {
          router.push("/auth/verify-email");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        form: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors({
        form: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative">
        <div className="w-full h-full flex flex-col items-center justify-center p-10">
          <div className="relative w-full h-[70vh] max-w-2xl mb-8">
            <Image
              src={img}
              alt="Welcome back to our community"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-center max-w-md space-y-3 px-6 z-10">
            <h2 className="text-2xl font-bold text-blue-900">Welcome Back!</h2>
            <p className="text-indigo-800 text-opacity-80">
              Continue your cinematic journey. Access your personalized
              recommendations and connect with fellow film lovers.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:py-12">
        <div className="w-full max-w-md relative z-20">
          {/* Header */}
          <div className="text-center mb-7">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-blue-800 text-base font-bold">
              Sign in to continue your cinematic journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="bg-white rounded-xl p-6 shadow-lg border border-blue-100 
                          hover:border-blue-200 transition-all duration-300
                          hover:shadow-blue-100/50 hover:shadow-xl"
            >
              <EmailInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                id="email"
                name="email"
                error={errors.email}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                id="password"
                name="password"
                error={errors.password}
              />

              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                  <p className="text-red-600 text-sm text-center">
                    {errors.form}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              variant="custom-blue"
              className="w-full h-12 disabled:opacity-50 disabled:transform-none shadow-md"
              size="md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="google-oauth"
              onClick={handleGoogleSignIn}
              className="w-full h-12 border border-gray-200 text-gray-700 font-medium 
                         hover:bg-gray-50 transition-all duration-300 flex items-center 
                        justify-center shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              size="md"
            >
              Continue with Google
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-7 text-center space-y-4">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:scale-105 inline-block"
              >
                Create account
              </Link>
            </p>

            {/* Back to Home Link */}
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center transition-all duration-200 hover:scale-105"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Home
              </Link>
            </div>

            {/* Terms and Privacy */}
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">
                By signing in, you agree to our{" "}
                <a
                  href="/terms"
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-800 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Mobile Only Intro - Visible on mobile */}
            <div className="mt-8 lg:hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 shadow-sm">
                <h3 className="text-blue-800 font-bold text-3xl mb-2">
                  Welcome Back!
                </h3>
                <p className="text-sm text-indigo-700 text-opacity-80">
                  Continue your cinematic journey with personalized
                  recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

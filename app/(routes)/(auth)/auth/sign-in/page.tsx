"use client";
import React, { useState } from "react";
import {
  Bookmark,
  Camera,
  Share2,
  Film,
  Mic,
  FileText,
  Sparkles,
  Globe,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import EmailInput from "@/app/components/inputFields/EmailInput";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginSchema } from "@/schemas/auth";
import Button from "@/app/components/Button";
import Logo from "@/assets/Snippit-logo-v2.svg";

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
        fieldErrors[err.path.join(".")] = err.message;
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

  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const floatingIcons = [
    { Icon: Bookmark, delay: "0s", duration: "4s", x: "10%", y: "15%" },
    { Icon: Camera, delay: "0.5s", duration: "5s", x: "85%", y: "20%" },
    { Icon: Share2, delay: "1s", duration: "4.5s", x: "15%", y: "80%" },
    { Icon: Film, delay: "1.5s", duration: "5.5s", x: "85%", y: "65%" },
    { Icon: Mic, delay: "2s", duration: "4s", x: "20%", y: "40%" },
    { Icon: FileText, delay: "2.5s", duration: "5s", x: "75%", y: "40%" },
    { Icon: Sparkles, delay: "3s", duration: "4.5s", x: "12%", y: "55%" },
    { Icon: Globe, delay: "3.5s", duration: "5.5s", x: "75%", y: "80%" },
  ];

  const iconsToRender = isMobile
    ? [floatingIcons[0], floatingIcons[1], floatingIcons[2], floatingIcons[3]]
    : floatingIcons;

  return (
    <div className="h-screen bg-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Floating icons */}
      {iconsToRender.map(({ Icon, delay, duration, x, y }, index) => (
        <div
          key={index}
          className="absolute text-[#5865F2]/20"
          style={{
            left: x,
            top: y,
            animation: `float ${duration} ease-in-out ${delay} infinite`,
          }}
        >
          <Icon size={isMobile ? 22 : 36} strokeWidth={1.5} />
        </div>
      ))}

      {/* CENTER WRAPPER */}
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-4">
          <Image
            src={Logo}
            alt="logo"
            width={140}
            height={40}
            className="mx-auto h-12"
          />
        </div>

        {/* FORM CARD */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-[#5865F2]/10 border border-gray-100 px-6 py-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-1">
              Welcome Back
            </h2>

            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-[#5865F2] font-semibold"
              >
                Create account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* FORGOT PASSWORD */}
            <div className="flex justify-end -mt-1">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[#5865F2] font-medium hover:underline"
              >
                Forgot password
              </Link>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {errors.form && (
              <div className="mb-4">
                <p className="text-red-600 text-xs text-center">
                  {errors.form}
                </p>
              </div>
            )}

            {/* divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-full hover:scale-110 transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  {" "}
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />{" "}
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />{" "}
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />{" "}
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c0.87-2.3 4.53-6.16 4.53z"
                  />{" "}
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

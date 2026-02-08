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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import TextInput from "@/app/components/inputFields/TextInput";
import EmailInput from "@/app/components/inputFields/EmailInput";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import PhoneNumberInput from "@/app/components/inputFields/PhoneNumberInput";
import Button from "@/app/components/Button";
import api from "@/lib/api";
import Logo from "@/assets/Snippit-logo-v2.svg";

const SignupPage: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const isFormValid =
    username.trim() !== "" && email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setErrors({ form: "Please fill out all required fields." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        username,
        email,
        password,
        phone: phoneNumber.trim() === "" ? undefined : phoneNumber,
      };

      await api.post("/auth/sign-up", payload);

      router.push("/auth/sign-in");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const fieldErrors: { [key: string]: string } = {};
        error.response.data.errors.forEach(
          (err: { field: string; message: string }) => {
            fieldErrors[err.field] = err.message;
          },
        );
        setErrors(fieldErrors);
      } else {
        setErrors({
          form: error.response?.data?.message || "Signup failed",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", {
      redirect: true,
      callbackUrl: "/dashboard",
    });
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
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* FLOATING ICONS */}
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
        <div className="text-center mb-6">
          <Image
            src={Logo}
            alt="logo"
            width={140}
            height={40}
            className="mx-auto h-10 sm:h-12"
          />
        </div>

        {/* CARD */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-[#5865F2]/10 border border-gray-100 px-5 sm:px-6 py-6 sm:py-7">
          {/* HEADER */}
          <div className="text-center mb-5">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1">
              Create Account
            </h2>

            <p className="text-gray-500 text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-[#5865F2] font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label="Username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              id="username"
              name="username"
            />

            {/* FIXED BUG HERE */}
            <EmailInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              name="email"
              error={errors.email}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              name="password"
              showStrength
              error={errors.password}
            />

            <PhoneNumberInput
              label="Phone (optional)"
              value={phoneNumber}
              onChange={(val) =>
                setPhoneNumber(val.startsWith("+") ? val : `+${val}`)
              }
              id="phone"
              name="phone"
              error={errors.phone}
            />

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="w-full h-11 mt-2 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>

            {errors.form && (
              <p className="text-red-600 text-xs text-center">{errors.form}</p>
            )}

            {/* divider */}
            <div className="relative my-4">
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
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center w-10 h-10 border border-gray-200 rounded-full hover:scale-110 transition"
              >
                {/* svg unchanged */}
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

export default SignupPage;

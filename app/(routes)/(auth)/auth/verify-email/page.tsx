"use client";

import React, { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  sendVerificationToken,
  verifyToken,
  checkVerificationToken,
} from "@/actions/auth/authActions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import Button from "@/app/components/Button";
import Logo from "@/assets/Snippit-logo-v2.svg";

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

const VerifyEmailPage = () => {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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

  const iconsToRender = isMobile ? floatingIcons.slice(0, 4) : floatingIcons;

  const checkTokenStatus = useCallback(async () => {
    if (!session?.user?.email) return;

    const result = await checkVerificationToken(session.user.email);

    if (result.success && result.exists) {
      setShowVerification(true);
      if (result.expiresAt) setExpiresAt(new Date(result.expiresAt));
    }

    setInitialLoading(false);
  }, [session]);

  useEffect(() => {
    checkTokenStatus();
  }, [checkTokenStatus]);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = expiresAt.getTime() - Date.now();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        setExpiresAt(null);
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSend = async () => {
    setLoading(true);

    setError("");
    setMessage("");
    setSuccess(false);

    try {
      const result = await sendVerificationToken(session!.user!.email);

      if (result.success) {
        setMessage(result.message);
        setShowVerification(true);
        setExpiresAt(new Date(result.data!.expiresAt));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to send email. Please try again.");
    }

    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) return setError("Enter code");

    setVerifying(true);

    setError("");
    setMessage("");

    const result = await verifyToken(session!.user!.email, otp);

    if (result.success) {
      setSuccess(true);
      await update();
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      setError(result.message);
    }

    setVerifying(false);
  };

  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Link href="/auth/sign-in" className="text-[#5865F2] font-semibold">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex items-center justify-center relative overflow-hidden px-4">
      {/* Floating icons */}
      {iconsToRender.map(({ Icon, delay, duration, x, y }, i) => (
        <div
          key={i}
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

      <div className="w-full max-w-md">
        {/* logo */}
        <div className="text-center mb-4">
          <Image
            src={Logo}
            alt="logo"
            width={140}
            height={40}
            className="mx-auto h-12"
          />
        </div>

        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-[#5865F2]/10 border border-gray-100 px-6 py-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              {success ? "Email verified" : "Verify your email"}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              <button
                onClick={() => {
                  signOut();
                  router.push("/auth/sign-in");
                }}
                className="text-[#5865F2] font-semibold"
              >
                Use different account
              </button>
            </p>
          </div>

          {success ? (
            <p className="text-green-600 text-center text-sm">
              Verified successfully. Redirecting...
            </p>
          ) : !showVerification ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Verify{" "}
                <span className="font-semibold">{session.user.email}</span>
              </p>

              <Button
                onClick={handleSend}
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
              >
                {loading ? "Sending..." : "Send verification code"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter code"
                className="w-full border rounded-xl h-11 px-4 text-center tracking-widest"
              />

              {timeRemaining && (
                <p className="text-xs text-center text-gray-500">
                  Expires in {timeRemaining}
                </p>
              )}

              <Button
                type="submit"
                disabled={verifying}
                className="w-full h-11 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
              >
                {verifying ? "Verifying..." : "Verify email"}
              </Button>

              <button
                type="button"
                onClick={handleSend}
                className="text-xs text-[#5865F2] w-full"
              >
                Resend code
              </button>
            </form>
          )}

          {!success && error && (
            <p className="text-red-600 text-xs text-center mt-3">{error}</p>
          )}

          {!success && message && (
            <p className="text-green-600 text-xs text-center mt-3">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

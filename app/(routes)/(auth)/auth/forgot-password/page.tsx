"use client";
import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

import EmailInput from "@/app/components/inputFields/EmailInput";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import Button from "@/app/components/Button";
import Logo from "@/assets/Snippit-logo-v2.svg";

import {
  sendPasswordResetToken,
  verifyToken,
} from "@/actions/auth/passwordActions";
import { changePassword } from "@/actions/user/changePassword";

const ForgotPasswordPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

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

  const handleSendResetToken = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await sendPasswordResetToken(email);

      if (result.success) {
        setMessage(result.message);
        setShowVerification(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return setError("Enter code");

    try {
      setVerifying(true);
      setError("");

      const result = await verifyToken(email, otp);

      if (result.success) {
        setShowVerification(false);
        setShowPasswordReset(true);
      } else {
        setError(result.message);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setResetting(true);
      const result = await changePassword(newPassword, email);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/sign-in"), 2000);
      } else {
        setError(result.message);
      }
    } finally {
      setResetting(false);
    }
  };

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

        {/* CARD */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-[#5865F2]/10 border border-gray-100 px-6 py-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              {success
                ? "Password reset"
                : showPasswordReset
                  ? "Create new password"
                  : showVerification
                    ? "Verify code"
                    : "Forgot password"}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              <Link
                href="/auth/sign-in"
                className="text-[#5865F2] font-semibold"
              >
                Back to sign in
              </Link>
            </p>
          </div>

          {/* SUCCESS */}
          {success && (
            <p className="text-center text-green-600 text-sm">
              Password reset successful. Redirecting...
            </p>
          )}

          {/* EMAIL STEP */}
          {!showVerification && !showPasswordReset && !success && (
            <div className="space-y-4">
              <EmailInput
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                name="email"
              />

              <Button
                onClick={handleSendResetToken}
                disabled={!email || loading}
                className="w-full h-11 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
              >
                {loading ? "Sending..." : "Send reset code"}
              </Button>
            </div>
          )}

          {/* VERIFY STEP */}
          {showVerification && (
            <form onSubmit={handleVerifyToken} className="space-y-4">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border rounded-xl h-11 px-4 text-center tracking-widest"
                placeholder="Enter code"
              />

              <Button
                type="submit"
                disabled={verifying}
                className="w-full h-11 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
              >
                {verifying ? "Verifying..." : "Verify code"}
              </Button>
            </form>
          )}

          {/* RESET STEP */}
          {showPasswordReset && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <PasswordInput
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                id="newPassword"
                name="newPassword"
              />

              <PasswordInput
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                id="confirmPassword"
                name="confirmPassword"
              />

              <Button
                type="submit"
                disabled={resetting}
                className="w-full h-11 bg-gradient-to-r from-[#5865F2] to-[#6B95FF]"
              >
                {resetting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}

          {error && (
            <p className="text-red-600 text-xs text-center mt-3">{error}</p>
          )}

          {message && (
            <p className="text-green-600 text-xs text-center mt-3">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

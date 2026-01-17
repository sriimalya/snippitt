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
import verifyImage from "@/public/assets/verify.png";
import Button from "@/app/components/Button";

const EmailVerificationPage = () => {
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

  const checkTokenStatus = useCallback(async () => {
    try {
      const result = await checkVerificationToken(session!.user!.email);

      if (result.success && result.exists) {
        if (result.expiresAt) {
          setExpiresAt(new Date(result.expiresAt));
        } else {
          setExpiresAt(null);
        }
        setShowVerification(true);
      }
      setInitialLoading(false);
    } catch (error) {
      console.error("Error checking token status:", error);
      setInitialLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.email) {
      checkTokenStatus();
    } else {
      setInitialLoading(false);
    }
  }, [session?.user?.email, checkTokenStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (expiresAt) {
      interval = setInterval(() => {
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();

        if (diffMs <= 0) {
          setTimeRemaining("Expired");
          setExpiresAt(null);
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diffMs / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expiresAt]);

  const handleSendVerification = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await sendVerificationToken(session!.user!.email);

      if (result.success) {
        setMessage(result.message);
        setExpiresAt(new Date(result.data!.expiresAt));
        setShowVerification(true);
      } else {
        setError(result.message);
        if (
          result.code === "TOKEN_ALREADY_SENT" &&
          result.message.includes("minutes")
        ) {
          const match = result.message.match(/in (\d+) minutes/);
          if (match && match[1]) {
            const minutes = parseInt(match[1], 10);
            setExpiresAt(new Date(Date.now() + minutes * 60 * 1000));
            setShowVerification(true);
          }
        }
      }
    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setMessage("");

      const result = await verifyToken(session!.user!.email, otp);

      if (result.success) {
        setSuccess(true);
        setMessage(result.message);
        await update();
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError("Failed to verify email. Please try again.");
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };
  const handleTryDifferentAccount = () => {
    signOut();
    router.push("/auth/sign-in");
  };
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-blue-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold blue-800 mb-4">
              Sign In Required
            </h1>
            <p className="text-blue-600 mb-6">
              Please sign in to verify your email address.
            </p>
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="w-full py-3 text-blue-600 font-medium hover:from-blue-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full h-full flex flex-col items-center justify-center p-10">
          <div className="relative w-full h-[60vh] max-w-2xl mb-8">
            <Image
              src={verifyImage}
              alt="Email Verification"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-center max-w-md space-y-3 px-6">
            <h2 className="text-3xl font-bold text-blue-800">
              Verify Your Email
            </h2>
            <p className="text-blue-blue-800 text-opacity-80">
              Secure your account with email verification and unlock all
              features.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              {success ? "Email Verified!" : "Verify Your Email"}
            </h1>
            <p className="text-blue-800 font-bold text-base">
              {success
                ? "Your email has been successfully verified"
                : "Secure your account with email verification"}
            </p>
          </div>

          {/* Mobile Image - Only visible on mobile */}
          <div className="lg:hidden mb-8">
            <div className="relative w-48 h-48 mx-auto">
              <Image
                src={verifyImage}
                alt="Email Verification"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {success ? (
            <div className="text-center space-y-6 bg-white rounded-xl p-8 shadow-lg border border-green-100">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800">{message}</h3>
              <p className="text-gray-600">Redirecting to dashboard...</p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto animate-pulse"></div>
            </div>
          ) : !showVerification ? (
            <div className="space-y-6 bg-white rounded-xl p-8 shadow-lg border border-blue-100">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">
                    To access all features, please verify your email address:
                  </p>
                  <p className="font-semibold text-gray-800 mt-2 text-lg">
                    {session.user.email}
                  </p>
                </div>
              </div>

              {message && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-green-700 text-sm">{message}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-red-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
              <Button
                onClick={handleSendVerification}
                disabled={loading}
                variant="custom-blue"
                size="lg"
                className="w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                    Sending Verification Code...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
              
              {/* Try with different account button */}
              <div className="text-center pt-4 border-t border-gray-100">
                <button
                  onClick={handleTryDifferentAccount}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                >
                  Try with different account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 bg-white rounded-xl p-8 shadow-lg border border-blue-100">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">
                    We&apos;ve sent a verification code to:
                  </p>
                  <p className="font-semibold text-gray-800 mt-1 text-lg">
                    {session.user.email}
                  </p>
                </div>

                {timeRemaining && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">
                      Code expires in
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        timeRemaining === "Expired"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {timeRemaining}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-semibold text-gray-800 mb-3"
                  >
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-full px-4 py-3 text-lg text-center tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>

                {message && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-green-700 text-sm">{message}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-500 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={verifying || timeRemaining === "Expired"}
                    variant="custom-blue"
                    size="md"
                    className="flex-1 flex items-center justify-center"
                  >
                    {verifying ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                        Verifying...
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setShowVerification(false);
                      setOtp("");
                      setError("");
                      setMessage("");
                    }}
                    variant="outline"
                    size="md"
                    className="px-6"
                  >
                    Back
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    onClick={handleSendVerification}
                    disabled={
                      loading ||
                      (timeRemaining !== null && timeRemaining !== "Expired")
                    }
                    variant="custom-blue"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 disabled:text-blue-800 disabled:cursor-not-allowed font-bold"
                  >
                    {loading
                      ? "Sending..."
                      : timeRemaining && timeRemaining !== "Expired"
                      ? "Code already sent"
                      : "Resend verification code"}
                  </Button>
                </div>

                {/* Try with different account button */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <button
                    onClick={handleTryDifferentAccount}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                  >
                    Try with different account
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;

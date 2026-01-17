"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmailInput from "@/app/components/inputFields/EmailInput";
import {
  sendPasswordResetToken,
  verifyToken,
} from "@/actions/auth/passwordActions";
import { changePassword } from "@/actions/user/changePassword";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import Button from "@/app/components/Button";
import Image from "next/image";
import forgotImage from "../../../../../../public/assets/forgot.png";

const Page = () => {
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
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

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

  const handleSendResetToken = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await sendPasswordResetToken(email);

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

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      setMessage("");

      const result = await verifyToken(email, otp);

      if (result.success) {
        setMessage(result.message);
        setShowVerification(false);
        setShowPasswordReset(true);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError("Failed to verify token. Please try again.");
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setResetting(true);
      setError("");
      setMessage("");

      const result = await changePassword(newPassword, email);

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || "Password has been reset successfully");

        setTimeout(() => {
          router.push("/auth/sign-in");
        }, 2000);
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="w-full h-full flex flex-col items-center justify-center p-10">
          <div className="relative w-full h-[60vh] max-w-2xl mb-8">
            <Image
              src={forgotImage}
              alt="Reset your password"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-center max-w-md space-y-3 px-6">
            <h2 className="text-2xl font-bold text-blue-900">
              Reset Your Password
            </h2>
            <p className="text-blue-800 text-opacity-80">
              Don&apos;t worry! We&apos;ll help you regain access to your
              account with a secure verification process.
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
              {success ? "Password Reset!" : "Forgot Password"}
            </h1>
            <p className="text-blue-800 text-base font-bold">
              {success
                ? "Your password has been successfully reset"
                : "Enter your email to reset your password"}
            </p>
          </div>

          {/* Mobile Image - Only visible on mobile */}
          <div className="lg:hidden mb-8">
            <div className="relative w-48 h-48 mx-auto">
              <Image
                src={forgotImage}
                alt="Reset your password"
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
              <p className="text-gray-600">Redirecting to sign in...</p>
              <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto animate-pulse"></div>
            </div>
          ) : showPasswordReset ? (
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
                  <p className="text-gray-600">Reset your password for:</p>
                  <p className="font-semibold text-gray-800 mt-2 text-lg">
                    {email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <PasswordInput
                  label="New Password"
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  showStrength={true}
                />

                <PasswordInput
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />

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

                <Button
                  type="submit"
                  disabled={resetting}
                  variant="custom-blue"
                  size="lg"
                  className="w-full"
                >
                  {resetting ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </div>
          ) : showVerification ? (
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
                    We&apos;ve sent a verification code to:
                  </p>
                  <p className="font-semibold text-gray-800 mt-1 text-lg">
                    {email}
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

              <form onSubmit={handleVerifyToken} className="space-y-6">
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

                <Button
                  type="submit"
                  disabled={verifying || timeRemaining === "Expired"}
                  variant="custom-blue"
                  size="lg"
                  className="w-full flex items-center justify-center"
                >
                  {verifying ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    onClick={handleSendResetToken}
                    disabled={
                      loading ||
                      (timeRemaining !== null && timeRemaining !== "Expired")
                    }
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 disabled:text-red-600 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Sending..."
                      : timeRemaining && timeRemaining !== "Expired"
                      ? "Code already sent"
                      : "Resend verification code"}
                  </Button>
                </div>
              </form>
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">
                    Enter your email address to reset your password
                  </p>
                </div>
              </div>

              <EmailInput
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error.includes("email") ? error : ""}
                id="reset-email"
                name="email"
              />

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

              {error && !error.includes("email") && (
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
                onClick={handleSendResetToken}
                disabled={loading || !email}
                variant="custom-blue"
                size="lg"
                className="w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                    Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

"use client";
import React, { useState } from "react";
import PasswordInput from "@/app/components/inputFields/PasswordInput";
import EmailInput from "@/app/components/inputFields/EmailInput";
import PhoneNumberInput from "@/app/components/inputFields/PhoneNumberInput";
import TextInput from "@/app/components/inputFields/TextInput";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";
import { signIn } from "next-auth/react";
import img from "@/public/assets/ChatGPT Image Sep 30, 2025, 07_22_59 AM.png";

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUserName] = useState("");
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

  const handlePhoneNumberChange = (value: string) => {
    const formattedPhoneNumber = value.startsWith("+") ? value : `+${value}`;
    setPhoneNumber(formattedPhoneNumber);
    setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleUserNameChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setUserName(e.target.value);
    setErrors((prev) => ({ ...prev, username: "" }));
  };

  const isFormValid =
    email.trim() !== "" && password.trim() !== "" && username.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrors({ form: "Please fill out all fields." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        email,
        password,
        username: username,
        phone: phoneNumber.trim() === "" ? undefined : phoneNumber,
      };

      const { data } = await api.post("/auth/sign-up", payload);
      console.log("Signup successful:", data);
      router.push("/auth/sign-in");
    } catch (error: any) {
      console.error("Error during signup:", error);
      if (error.response) {
        if (error.response.data.errors) {
          const fieldErrors: { [key: string]: string } = {};
          error.response.data.errors.forEach(
            (err: { field: string; message: string }) => {
              fieldErrors[err.field] = err.message;
            }
          );
          setErrors(fieldErrors);
        } else {
          setErrors({ form: error.response.data.message });
        }
      } else {
        setErrors({
          form: "An error occurred during signup. Please try again.",
        });
      }
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
              alt="Join our community"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-center max-w-md space-y-3 px-6 z-10">
            <h2 className="text-2xl font-bold text-blue-900">
              Join Our Community
            </h2>
            <p className="text-blue-800 text-opacity-80">
              Connect with fellow film enthusiasts, discover new movies, and
              share your recommendations in our growing community of cinema
              lovers.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:py-12">
        <div className="w-full max-w-md relative z-20">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-5"></div>
            <h1 className="text-blue-800 font-bold text-3xl">
              Create Your Account
            </h1>
            <p className="text-blue-800 text-base font-bold">
              Join us today and start your cinematic journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="bg-white rounded-xl p-6 shadow-lg border border-blue-300 bg-gradient-to-br from-white to-blue-50
shadow-[0_0_0_1px_rgba(59,130,246,0.1)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_10px_30px_-10px_rgba(59,130,246,0.3)]"
            >
              <TextInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChange={handleUserNameChange}
                id="name"
                name="name"
                // error={errors.username}
              />

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
                showStrength={true}
                id="password"
                name="password"
                error={errors.password}
              />

              <PhoneNumberInput
                label="Phone Number (Optional)"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                id="phone"
                name="phone"
                error={errors.phone}
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
              className="w-full h-12  disabled:opacity-50 disabled:transform-none shadow-md"
              size="md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="text-blue-600 w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
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
              justify-center shadow-sm relative hover:scale-[1.02] active:scale-[0.98]
              after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2
              after:w-0 after:h-0 after:border-t-[6px] after:border-b-[6px]
              after:border-r-[8px] after:border-t-transparent after:border-b-transparent
              after:border-r-white after:-right-1"
              size="md"
            >
              Continue with Google
            </Button>
          </form>

          {/* Footer */}
          {/* Modify your existing footer */}
          <div className="mt-7 text-center space-y-3">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

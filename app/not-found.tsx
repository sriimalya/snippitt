"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import Button from "@/app/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="p-6 bg-gray-100 rounded-[2.5rem] text-gray-400">
            <FileQuestion size={64} strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
            404 - Lost in Space?
          </h1>
          <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved to a new galaxy.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              icon={<ArrowLeft size={18} />}
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="theme-primary"
                icon={<Home size={18} />}
                className="w-full sm:w-auto shadow-lg shadow-[#5865F2]/20"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/actions/collection";
import { toast } from "sonner";
import { FolderPlus, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import Button from "@/app/components/Button";

export default function NewCollectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Collection name is required");

    setIsSubmitting(true);
    const toastId = toast.loading("Creating your collection...");

    try {
      const result = await createCollection(name);

      if (result.success) {
        toast.success("Collection created!", { id: toastId });

        router.push(`/my-collections`);
      } else {
        toast.error(result.error?.message || "Something went wrong", {
          id: toastId,
        });
        setIsSubmitting(false); // Only reset loading if it failed
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/my-collections"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          BACK TO COLLECTIONS
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#5865F2]/10 rounded-[1.5rem] flex items-center justify-center text-[#5865F2] mb-6">
              <FolderPlus size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              New Collection
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-2">
              Organize your snippets into a fresh workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1"
              >
                Collection Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Go Backend Utils"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#5865F2] focus:ring-4 focus:ring-[#5865F2]/5 outline-none transition-all font-bold text-gray-900"
                  autoFocus
                />
                <Sparkles
                  size={18}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="theme-primary"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-4 rounded-2xl shadow-xl shadow-[#5865F2]/20"
              icon={
                isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <FolderPlus size={20} />
                )
              }
            >
              {isSubmitting ? "Creating..." : "Create Collection"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

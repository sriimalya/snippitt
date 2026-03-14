"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@/actions/collection";
import { generatePresignedUrlAction } from "@/actions/upload";
import { toast } from "sonner";
import { 
  FolderPlus, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Globe, 
  Lock, 
  Users,
  Camera,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/app/components/Button";
import { Visibility } from "@/app/generated/prisma/enums";

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all";

const inputClass = (hasError: boolean) =>
  `${inputBase} focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 hover:border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

const Field = ({
  label,
  counter,
  error,
  children,
}: {
  label: string;
  counter?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-0.5">
      <label className="text-sm font-semibold text-gray-900">{label}</label>
      {counter && (
        <span className="text-xs text-gray-400 tabular-nums">{counter}</span>
      )}
    </div>
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block shrink-0" />
        {error}
      </p>
    )}
  </div>
);

export default function NewCollectionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: Visibility.PRIVATE as Visibility,
    coverImage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({
    name: "",
  });
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrors({ name: "Collection name is required" });
      return false;
    }
    setErrors({ name: "" });
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be less than 5MB");

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be less than 5MB");

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    let finalCoverUrl = "";

    try {
      if (selectedFile) {
        const toastId = toast.loading("Uploading cover image...");
        const res = await generatePresignedUrlAction({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        });

        if (!res.success || !res.data) throw new Error(res.message);

        const uploadRes = await fetch(res.data.uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });

        if (!uploadRes.ok) throw new Error("S3 Upload failed");
        finalCoverUrl = res.data.fileUrl;
        toast.dismiss(toastId);
      }

      const createRes = await createCollection({
        ...formData,
        coverImage: finalCoverUrl,
      });

      if (createRes.success) {
        toast.success("Collection created!");
        router.push(`/my-collections`);
      } else {
        toast.error(createRes.error?.message || "Failed to create collection");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <header>
          <Link
            href="/my-collections"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-6 group"
          >
          <ArrowLeft
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Collections
        </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                New Collection
              </h1>
              <p className="text-sm text-gray-500">
                Organize your snippets into a fresh workspace.
              </p>
            </div>
          </div>
        </header>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Progress bar (aesthetic) */}
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-linear-to-r from-indigo-500 to-indigo-300 w-full animate-in slide-in-from-left duration-1000" />
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            <div className="p-6 sm:p-8 space-y-8">
              {/* Cover Image */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Cover Image</label>
                <div
                  className="relative h-48 w-full rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer transition-all hover:border-indigo-400 hover:bg-indigo-50/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Camera size={24} className="text-indigo-500" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest mt-1">
                        Click to upload cover
                      </span>
                    </div>
                  )}
                  {previewUrl && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white backdrop-blur-[2px]">
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={28} />
                        <span className="text-xs font-bold">Change Image</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {isMobile && !previewUrl && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors mt-2"
                  >
                    <Camera size={18} />
                    Take a Photo
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                />
              </div>

              {/* Name */}
              <Field
                label="Collection Name"
                counter={`${formData.name.length}/40`}
                error={errors.name}
              >
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value.slice(0, 40) });
                      if (errors.name) setErrors({ name: "" });
                    }}
                    placeholder="e.g. Awesome React Hooks"
                    className={inputClass(!!errors.name)}
                    autoFocus
                  />
                  <Sparkles
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 opacity-0 group-focus-within:opacity-100 transition-opacity"
                  />
                </div>
              </Field>

              {/* Description */}
              <Field
                label="Description"
                counter={`${formData.description.length}/200`}
              >
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value.slice(0, 200),
                    })
                  }
                  rows={3}
                  placeholder="What's this collection about?"
                  className={`${inputBase} resize-none`}
                />
              </Field>

              {/* Visibility */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Visibility</label>
                <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100 max-w-sm">
                  {[
                    { id: Visibility.PUBLIC, icon: <Globe size={14} />, label: "Public" },
                    { id: Visibility.FOLLOWERS, icon: <Users size={14} />, label: "Followers" },
                    { id: Visibility.PRIVATE, icon: <Lock size={14} />, label: "Private" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: v.id })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        formData.visibility === v.id
                          ? "bg-white text-indigo-600 shadow-sm border border-indigo-100"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {v.icon}
                      <span className="">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-6 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs text-gray-400 max-w-sm">
                Collections allow you to group related snippets together. You can always change these settings later.
              </p>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !formData.name.trim()}
                className="w-full sm:w-auto min-w-[180px] py-3.5 rounded-xl shadow-lg shadow-indigo-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus size={18} className="mr-2" />
                    Create Collection
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
